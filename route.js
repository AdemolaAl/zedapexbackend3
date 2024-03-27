const passport = require('passport');
const bcrypt = require('bcryptjs');
const shortId = require('shortid')
const Memcached = require('memcached');
const memcached = new Memcached(); // Replace with your Memcached server configuration
/* code to connect with your memecahced server */
memcached.connect('localhost:3000', function (err, conn) {
  if (err) {
    console.log(conn.server, 'error while memcached connection!!');
  }
});
const { ObjectId } = require('mongodb');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const fs = require('fs');
const { error } = require('console');
const registration = require('./registration');


module.exports = function (app, userDB, DB, productDB
) {
  // After connecting to MongoDB
  const bucket = new GridFSBucket(DB);
  registration(app, userDB, DB, productDB)

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  app.route('/drop').get((req, res,) => {

    bucket.drop(function (err, result) {
      if (err) {
        console.error('Error dropping GridFS bucket:', err);
        return;
      }

      console.log('GridFS bucket dropped successfully');
    });
  });

  function getYouTubeId(url) {
    var regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11}\S*)/;
    var match = url.match(regExp);
    return match[1];
  }

  app.route('/').get((req, res,) => {
    productDB.find({}).toArray((err, HomePageCourses) => {
      if (err) {
        next(err);
      } else {
        const HomePageCoursesSliced = shuffleArray(HomePageCourses).slice(0, 6);
        if (req.isAuthenticated()) {
          let user = req.user
          res.render('index', { HomePageCoursesSliced, flash: req.flash(), user, myfunction: getYouTubeId });

        }
        else {
          res.render('index', { HomePageCoursesSliced, flash: req.flash(), myfunction: getYouTubeId });
        }

      }
    });

  });


  app.get('/enroll', (req, res) => {
    res.render('enroll')
  })
  app.get('/studentenroll', (req, res) => {
    res.render('studentenroll')
  })
  app.get('/checkout', (req, res) => {
    res.render('checkout')
  })

  app.get('/physical', (req, res) => {
    res.render('physical')
  })


  app.get('/add', (req, res) => {
    res.render('insert');
  })

  app.post('/add', async (req, res) => {
    const document = req.body;
    document.shortId = shortId.generate();
    if (!Array.isArray(document.include)) {
      document.include = [document.include];
    }
    if (!Array.isArray(document.learn)) {
      document.learn = [document.learn];
    }

    await productDB.insertOne(document, (err, result) => {
      if (err) {
        console.error('Error inserting document:', err);
        return res.sendStatus(500);
      }
      res.redirect(`/coursepage/${document.shortId}`);
    });
  })







  app.route('/coursepage/:cat').get((req, res) => {

    let { cat } = req.params;

    productDB.findOne({ shortId: cat }, (err, course) => {
      if (err) {
        next(err);
        req.flash('error', 'Category not found')
        res.redirect('/')
      } else {
        if (req.isAuthenticated()) {
          let user = req.user
          res.render('coursepage', { course, cat, user, myfunction: getYouTubeId });;

        }

        else { res.render('coursepage', { course, cat, myfunction: getYouTubeId }); }

      }
    });

  });




  app.get('/auth/google',
    passport.authenticate('google', {
      scope:
        ['email', 'profile']
    }
    ));

  app.get('/auth/google/callback',
    passport.authenticate('google', {

      successRedirect: '/profile',
      failureRedirect: '/'
    }));



  app.post('/deleteaccount', async (req, res) => {
    await userDB.deleteOne({ shortId: req.user.shortId }, (err) => {
      if (err) {
        req.flash('error', 'Error deleting account');
        return res.redirect('/profile');
      }
    })

    req.flash('success', 'Account deleted');
    return res.redirect('/');

  })

  const upload = multer({ dest: 'uploads/' });



  const { ObjectId } = require('mongodb');

  app.get('/deleteimage/:shortId', (req, res) => {
    const { shortId } = req.params;

    productDB.findOne({ shortId }, (err, productDocument) => {
      if (err) {
        console.error('Error retrieving image from productDB:', err);
        return res.sendStatus(500);
      }

      if (productDocument) {
        // The image is found in productDB, get the fileId from the document
        const fileId = new ObjectId(productDocument.fileId);

        // Delete the file from GridFS using the bucket
        bucket.delete(fileId, (err) => {
          if (err) {
            console.error('Error deleting image from GridFS:', err);
            return res.sendStatus(500);
          }

          console.log('Image deleted from productDB and GridFS');
          return res.sendStatus(200); // Sending a 200 status to indicate successful deletion
        });
      } else {
        userDB.findOne({ shortId }, (err, userDocument) => {
          if (err) {
            console.error('Error retrieving image from userDB:', err);
            return res.sendStatus(500);
          }

          if (!userDocument) {
            console.error('Image not found in both productDB and userDB');
            return res.sendStatus(404); // Sending a 404 status to indicate image not found
          }

          // The image is found in userDB, get the fileId from the document
          const fileId = new ObjectId(userDocument.fileId);

          // Delete the file from GridFS using the bucket
          bucket.delete(fileId, (err) => {
            if (err) {
              console.error('Error deleting image from GridFS:', err);
              return res.sendStatus(500);
            }

            console.log('Image deleted from userDB and GridFS');
            return res.sendStatus(200); // Sending a 200 status to indicate successful deletion
          });
        });
      }
    });
  });


  app.get('/images/:shortId', (req, res) => {
    const { shortId } = req.params;

    // If the image is not found in productDB, try finding it in userDB
    userDB.findOne({ shortId }, (err, userDocument) => {
      if (err || !userDocument) {
        console.error('Error retrieving image from userDB:', err);
        return res.send('not found');
      }

      // The image is found in userDB, get the fileId from the document
      const fileId = new ObjectId(userDocument.fileId);

      // Open a download stream from GridFS in the userDB
      const downloadStream = bucket.openDownloadStream(fileId);

      // Set the appropriate content type
      res.contentType('image/webP');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Expires', new Date(Date.now() + 86400000).toUTCString());

      // Pipe the GridFS download stream to the response
      downloadStream.pipe(res)
        .on('error', (err) => {
          console.error('Error streaming image:', err);
          return res.sendStatus(500);
        });
    });
  });


  // Helper function to upload a file to GridFS and return the fileId
  async function uploadFileToGridFS(bucket, file) {
    return new Promise((resolve, reject) => {
      const readableStream = fs.createReadStream(file.path);
      const uploadStream = bucket.openUploadStream(file.originalname);

      readableStream.pipe(uploadStream)
        .on('error', (err) => reject(err))
        .on('finish', () => {
          fs.unlinkSync(file.path);
          resolve(uploadStream.id);
        });
    });
  }

  // Helper function to delete a file from GridFS using its fileId
  async function deleteFileFromGridFS(bucket, fileId) {
    return new Promise((resolve, reject) => {
      bucket.delete(new ObjectId(fileId), (err) => {
        if (err) {
          console.error('Error deleting image from GridFS:', err);
          reject(err);
        } else {
          console.log('Image deleted from userDB and GridFS');
          resolve();
        }
      });
    });
  }

  app.post('/profileupdate', upload.single('picture'), async (req, res) => {
    try {
      const { username } = req.user;
      const { file } = req;

      if (file) {
        // If a new file is uploaded, delete the existing file (if any) and upload the new one
        if (req.user.fileId) {
          await deleteFileFromGridFS(bucket, req.user.fileId);
        }

        const fileId = await uploadFileToGridFS(bucket, file);

        // Update the user profile with the new fileId
        await userDB.updateOne(
          { username },
          {
            $set: {
              username: req.body.username,
              email: req.body.email,
              fileId,
              shortId: shortId.generate()
            },
          }
        );
      } else {
        // If no new file is uploaded, update the user profile without changing the fileId
        await userDB.updateOne(
          { username },
          {
            $set: {
              username: req.body.username,
              email: req.body.email,
            },
          }
        );
      }

      req.flash('success', 'Profile updated successfully!');
      return res.redirect('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      req.flash('error', 'Error updating profile. Please try again.');
      return res.redirect('/profile');
    }
  });


  app.post('/passwordupdate', (req, res) => {
    const hash = bcrypt.hashSync(req.body.newpassword, 12);

    if (!bcrypt.compareSync(req.body.currentpassword, req.user.password)) {
      req.flash('error', 'Incorrect Password');
      return res.redirect('/profile');
    } else {
      userDB.updateOne(
        { username: req.user.username },
        { $set: { password: hash } },
        (err, result) => {
          if (err) {
            console.log('Error updating password:', err);
            req.flash('error', 'Error updating password. Please try again.');
            return res.redirect('/profile');
          } else {
            console.log('Password updated successfully');
            req.flash('success', 'Password updated successfully.');
            return res.redirect('/profile');
          }
        }
      );
    }
  });


  app.get('/logout', function (req, res, next) {
    req.logout(function (err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });




}


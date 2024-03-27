const passport = require('passport');
const bcrypt = require('bcryptjs');
const shortId = require('shortid')
const path = require('path');
const fs = require('fs');

module.exports = function (app, userDB, DB, productDB) {


    app.get('/usersignin', (req, res) => {
        if (req.isAuthenticated()) {
            res.redirect('/userdashboard/mydashboard');
        } else {
            res.render('usersignin', { flash: req.flash() });
        }
    })


    app.get('/usersignup', (req, res) => {
        res.render('usersignup')

    })

    app.get('/admindashboard/:hello', (req, res) => {
        let { hello } = req.params;
        const filePath = path.join(__dirname, 'views', 'html', `${hello}.html`);

        fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
            if (err) {
                console.error('Error reading the HTML file', err);
                return res.status(500).send('An error occurred');
            }
            // Render your Pug template, passing the HTML content along with other data
            res.render('admindashboard', { flash: req.flash(), content: data, name: hello });
        });
    });

    app.get('/userdashboard/:hello', isAuthenticated('user'), (req, res) => {
        let { hello } = req.params;
        const filePath = path.join(__dirname, 'views', "user", `${hello}.html`);

        fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
            if (err) {
                console.error('Error reading the HTML file', err);
                return res.status(500).send('An error occurred');
            }
            // Render your Pug template, passing the HTML content along with other data
            res.render('userdashboard', { flash: req.flash(), content: data, name: hello });
        });
    });


    app.post('/usersignup', async (req, res, next) => {
        const hash = bcrypt.hashSync(req.body.password, 12);
        await userDB.insertOne(
            {
                username: req.body.username,
                email: req.body.email,
                password: hash,
                role:'user',
                shortId: shortId.generate(),
            },
            (err, result) => {
                if (err) {
                    console.log('Error inserting user:', err);
                    req.flash('error', 'Error registering user. Please try again.');
                } else {
                    console.log('User registered successfully')
                }
            }
        );
        next()

    }, passport.authenticate('user', { failureRedirect: '/' }),
        (req, res, next) => {
            res.redirect('/userdashboard/mydashboard');
        });

    app.route('/usersignin').post((req, res, next) => {


        passport.authenticate('user', {
            failureRedirect: '/usersignin',
            failureFlash: true // Enable flash messages for authentication failures
        })(req, res, next);
    }, (req, res) => {

        // This is the success callback after successful authentication
        req.flash('success', 'Successfully Signed in');
        res.redirect('/userdashboard/mydashboard');
    });

    function isAuthenticated(role) {
        return (req, res, next) => {
            if (req.isAuthenticated() && req.user.role === role) {
            return next();
            }
            res.redirect(`/${role}signin`);
        };
    }

}
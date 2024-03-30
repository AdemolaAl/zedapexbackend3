var slided = false;

function handleslide(){
    if(!slided){
        document.getElementById('left').style.display = 'block';
        document.getElementById('left').style.width = '80%';
        slided= !slided
    }
    else{
        
        document.getElementById('left').style.width = '0%';
        document.getElementById('left').style.display = 'none';
        slided= !slided   
    }

}
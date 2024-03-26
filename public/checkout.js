function changeColor(element) {
  // Clear the background color of all divs
  var divs = document.querySelectorAll('.cvr1');
  divs.forEach(function(div) {
    div.classList.remove('selected');
  });


  var priceElement = element.querySelector('.right'); // Assuming the class 'right' contains the price
  var price = priceElement.innerText.trim(); // Retrieve the price text and trim any leading/trailing white spaces

  document.getElementById('price').innerText = price;
  document.getElementById('price1').innerText = price;


  element.classList.add('selected');

}

window.onload = function() {
  var firstElement = document.querySelector('.cvr1');
  changeColor(firstElement);
};
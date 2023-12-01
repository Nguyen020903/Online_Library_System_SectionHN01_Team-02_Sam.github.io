// script.js

function copyToClipboard(elementId) {
    /* Get the text content from the element with the specified ID */
    const textToCopy = document.getElementById(elementId).innerText;

    /* Create a temporary input element */
    const inputElement = document.createElement('input');

    /* Set the input element value to the text content to be copied */
    inputElement.value = textToCopy;

    /* Append the input element to the document body */
    document.body.appendChild(inputElement);

    /* Select the text content of the input element */
    inputElement.select();

    /* Execute the copy command */
    document.execCommand('copy');

    /* Remove the temporary input element */
    document.body.removeChild(inputElement);

    /* Display a notification or any other desired feedback to the user */
    alert('Email address copied to clipboard!');
}

const track = document.getElementById("image-track");

const handleOnDown = e => track.dataset.mouseDownAt = e.clientX;

const handleOnUp = () => {
  track.dataset.mouseDownAt = "0";  
  track.dataset.prevPercentage = track.dataset.percentage;
}

const handleOnMove = e => {
  if(track.dataset.mouseDownAt === "0") return;
  
  const mouseDelta = parseFloat(track.dataset.mouseDownAt) - e.clientX,
        maxDelta = window.innerWidth / 2;
  
  const percentage = (mouseDelta / maxDelta) * -100,
        nextPercentageUnconstrained = parseFloat(track.dataset.prevPercentage) + percentage,
        nextPercentage = Math.max(Math.min(nextPercentageUnconstrained, 0), -100);
  
  track.dataset.percentage = nextPercentage;
  
  track.animate({
    transform: `translate(${nextPercentage}%, -50%)`
  }, { duration: 1200, fill: "forwards" });
  
  for(const image of track.getElementsByClassName("image")) {
    image.animate({
      objectPosition: `${100 + nextPercentage}% center`
    }, { duration: 1200, fill: "forwards" });
  }
}

/* -- Had to add extra lines for touch events -- */

window.onmousedown = e => handleOnDown(e);

window.ontouchstart = e => handleOnDown(e.touches[0]);

window.onmouseup = e => handleOnUp(e);

window.ontouchend = e => handleOnUp(e.touches[0]);

window.onmousemove = e => handleOnMove(e);

window.ontouchmove = e => handleOnMove(e.touches[0]);



// //Background Set for Categories

// $('.set-bg').each(function () {
//   var bg = $(this).data('setbg');
//   $(this).css('background-image', 'url(' + bg + ')');
// });

// //// Carousel

// $(".categories__slider").owlCarousel({
//   loop: true,
//   margin: 0,
//   items: 4,
//   dots: false,
//   nav: true,
//   navText: ["<span class='fa fa-angle-left'><span/>", "<span class='fa fa-angle-right'><span/>"],
//   animateOut: 'fadeOut',
//   animateIn: 'fadeIn',
//   smartSpeed: 1200,
//   autoHeight: false,
//   autoplay: true,
//   responsive: {

//       0: {
//           items: 1,
//       },

//       480: {
//           items: 2,
//       },

//       768: {
//           items: 3,
//       },

//       992: {
//           items: 4,
//       }
//   }
// });


// $('.hero__categories__all').on('click', function(){
//   $('.hero__categories ul').slideToggle(400);
// });

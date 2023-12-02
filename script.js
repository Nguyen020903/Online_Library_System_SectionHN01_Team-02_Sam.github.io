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

// Home Carousel
var swiper = new Swiper(".books-slider", {
    loop:true,
    centeredSlides: true,
    autoplay: {
        delay: 9500,
        disableOnInteraction: false,
    },
    breakpoints: {
        0: {
            slidesPerView: 1,
        },
        768: {
            slidesPerView: 2,
        },
        1024: {
            slidesPerView: 3,
        },
    },
});

// Featured carousel
var swiper = new Swiper(".books-sliderfeatured", {
    loop: true,
    centeredSlides: true,
breakpoints: {
    0: {
        slidesPerView: 2,
    },
    768: {
        slidesPerView: 3,
    },
    1024: {
        slidesPerView: 4,
    },
    1600: {
        slidesPerView: 6,
    }
},
});
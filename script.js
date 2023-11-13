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


//ідея: цей файл є вхідною точкою для даних від користувача і делегаціїї їх відповідним функціям, що надходять з ніших модулів
import '@babel/polyfill';
import { bookTour } from './stripe';
import { displayMap } from './leaflet';
import { login, logout } from './login';
import { updateSettings } from './updatingSettings';

//цей код буде спрацьовувати лише тоді коли користувач буде натискати на Submit

// Get locations from HTML
//DOM ELEMENTS
const leaflet = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const updateUserBtn = document.querySelector('.form-user-data');
const userPasswordBtn = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

//DELEGATION
if (leaflet) {
  const locations = JSON.parse(leaflet.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    event.preventDefault();
    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

if (updateUserBtn) {
  updateUserBtn.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    updateSettings(form, 'data');
  });
}

if (userPasswordBtn) {
  userPasswordBtn.addEventListener('submit', async (event) => {
    event.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating....';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').textContent =
      'Update password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (bookBtn)
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });

/* eslint-disable */
import { showAlert } from './alerts';
import axios from 'axios';
// Сворення функції оновлення даних

//type=='password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/.netlify/functions/api/v1/users/updateMyPassword'
        : '/.netlify/functions/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

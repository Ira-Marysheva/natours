/* eslint-disable */
import axios from 'axios';
// const Stripe = require('stripe');
import { showAlert } from './alerts';
// import Stripe from 'stripe';

const stripe = Stripe(
  'pk_test_51NL0wDDBfjGSbo93FyzbCHdeT2lb8ZvPDX9Y72XZj60SNdgDHyUTGoty4rTZ5nfbUF2xO8n6GBXMHgmKAucGMMMJ00NOVhlYqM'
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};

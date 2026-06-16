import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import "./Payment.css";
import PaymentForm from "./PaymentForm";

export default function PaymentCheckout() {
  const stripePromise = loadStripe(
    "pk_test_51S8EYEKB8OhCxP7hVxCafNmhq3KZAIg1PdeKDWPcKllx7mGyOdzm1DTzzgW5j7Ofs5uTalM3hs648H3oqUBNm5AN00SFJmDPGk",
  );

  return (
    <section className="bg-slide-img py-16">
      <Elements stripe={stripePromise}>
        <PaymentForm />
      </Elements>
    </section>
  );
}

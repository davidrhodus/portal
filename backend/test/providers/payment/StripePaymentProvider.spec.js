import {describe, it} from "mocha";
import "chai/register-should";
import StripePaymentProvider from "../../../src/providers/payment/StripePaymentProvider";
import {
  CardBrands,
  PaymentCard,
  PaymentCurrencies,
  PaymentTypes
} from "../../../src/providers/payment/BasePaymentProvider";
import {Configurations} from "../../../src/_configuration";

const stripePaymentProvider = new StripePaymentProvider(Configurations.payment.test);

const TEST_CVC_NUMBER = "333";
const TEST_EXPIRATION_DATE = new Date(2025, 10, 1, 1, 33, 30, 0);

const TEST_CARDS = {
  no_auth_visa: new PaymentCard(CardBrands.visa, "4242424242424242", TEST_CVC_NUMBER, TEST_EXPIRATION_DATE),
  auth_card: new PaymentCard(CardBrands.unknown, "4000002500003155", TEST_CVC_NUMBER, TEST_EXPIRATION_DATE),
  without_funds: new PaymentCard(CardBrands.unknown, "4000000000009995", TEST_CVC_NUMBER, TEST_EXPIRATION_DATE),
};


if (Configurations.payment.test.client_id && Configurations.payment.test.client_secret) {

  describe("StripePaymentProvider", () => {

    describe("makeIntentPayment that don’t require authentication", () => {
      it("Created a Payment with amount, currency, type type and description", async () => {
        const currency = PaymentCurrencies.usd;
        const amount = 90;
        const description = "Test payment with Pocket dashboard";

        const paymentResult = await stripePaymentProvider.makeIntentPayment(PaymentTypes.card, currency, amount, description);

        // eslint-disable-next-line no-undef
        should.exist(paymentResult);

        paymentResult.should.be.an("object");
        paymentResult.paymentNumber.should.be.a("string");
      });
    });
  });
}

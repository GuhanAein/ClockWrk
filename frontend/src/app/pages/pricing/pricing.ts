import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar';

declare var Razorpay: any;

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './pricing.html',
  styleUrls: ['./pricing.css']
})
export class PricingComponent {

  RAZORPAY_KEY_ID = 'rzp_test_1DP5mmOlF5G5ag';

  isYearly = true; // Default to yearly for better value perception

  get plans() {
    return [
      {
        name: 'Free',
        price: '0',
        period: '/forever',
        features: [
          'Track up to 5 Habits',
          'Basic Analytics',
          '7-Day History',
          'Community Themes',
          'Standard Support'
        ],
        cta: 'Current Plan',
        active: true,
        highlight: false
      },
      {
        name: 'Pro AI',
        // Yearly: 119, Monthly: 39
        price: this.isYearly ? '119' : '39',
        // Original price (renewal price)
        originalPrice: this.isYearly ? '600' : '59',
        period: this.isYearly ? '/first year' : '/first month',
        renewalPrice: this.isYearly ? 'Renews at ₹600/year' : 'Renews at ₹59/month',
        currency: 'INR',
        features: [
          '✨ Smart AI Habit Insights',
          'Unlimited Habits',
          'Advanced Analytics & Trends',
          'Unlimited History',
          '🎨 Premium Glassmorphism Themes',
          'Priority Support',
          'Data Export (CSV/PDF)'
        ],
        cta: 'Subscribe Now',
        active: false,
        highlight: true
      }
    ];
  }

  toggleBilling() {
    this.isYearly = !this.isYearly;
  }

  handlePayment(plan: any) {
    if (plan.active) return;

    const amount = parseInt(plan.price) * 100; // INR subunits (paise)

    const options = {
      key: this.RAZORPAY_KEY_ID,
      amount: amount,
      currency: 'INR',
      name: 'ClockWrk',
      description: `Pro AI Subscription (${this.isYearly ? 'Yearly' : 'Monthly'})`,
      image: 'https://clockwrk.com/logo.png',
      handler: function (response: any) {
        alert("Payment Successful!\nPayment ID: " + response.razorpay_payment_id);
      },
      prefill: {
        name: 'Guhan',
        email: 'guhan@example.com',
        contact: '9999999999'
      },
      theme: {
        color: '#617FDE'
      }
    };

    const rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function (response: any) {
      alert("Payment Failed: " + response.error.description);
    });
    rzp1.open();
  }
}

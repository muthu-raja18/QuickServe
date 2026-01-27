

// EmailJS Configuration - PUT YOUR ACTUAL CREDENTIALS HERE

import { collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './config';

// EmailJS Configuration - PUT YOUR ACTUAL CREDENTIALS HERE
const EMAILJS_CONFIG = {
  SERVICE_ID: "service_sy40kho", // Replace with your EmailJS Service ID
  TEMPLATE_ID: "template_r2bkqul", // Replace with your EmailJS Template ID
  USER_ID: "SWuSsSKO1cVrZgD4f", // Replace with your EmailJS Public Key
};

// Send OTP Email using EmailJS
const sendOTPEmail = async (email, otp) => {
  try {
    console.log('📧 Attempting to send OTP to:', email);
    
    // Validate credentials and email
    if (!EMAILJS_CONFIG.SERVICE_ID || EMAILJS_CONFIG.SERVICE_ID === 'your_service_id_here') {
      throw new Error('EmailJS Service ID not configured. Please update emailOTP.js with your actual Service ID.');
    }
    
    if (!EMAILJS_CONFIG.TEMPLATE_ID || EMAILJS_CONFIG.TEMPLATE_ID === 'your_template_id_here') {
      throw new Error('EmailJS Template ID not configured. Please update emailOTP.js with your actual Template ID.');
    }
    
    if (!EMAILJS_CONFIG.USER_ID || EMAILJS_CONFIG.USER_ID === 'your_user_id_here') {
      throw new Error('EmailJS User ID not configured. Please update emailOTP.js with your actual Public Key.');
    }

    if (!email || email.trim() === '') {
      throw new Error('Recipient email address is empty');
    }

    // Calculate expiration time (15 minutes from now)
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000);
    const formattedTime = expirationTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    // EmailJS template parameters - MUST MATCH YOUR TEMPLATE VARIABLES
    const templateParams = {
      to_email: email,      // This matches your template's {{to_email}}
      passcode: otp,        // This matches your template's {{passcode}}
      time: formattedTime,  // This matches your template's {{time}}
      // Remove otp_code since your template doesn't use it
    };

    console.log('📧 Sending to EmailJS with params:', templateParams);

    // Send email using EmailJS
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.SERVICE_ID,
        template_id: EMAILJS_CONFIG.TEMPLATE_ID,
        user_id: EMAILJS_CONFIG.USER_ID,
        template_params: templateParams
      })
    });

    const responseText = await response.text();
    console.log('📧 EmailJS raw response:', responseText);

    if (response.ok) {
      console.log('✅ Email sent successfully!');
      return { 
        success: true, 
        message: 'OTP sent to your email successfully!' 
      };
    } else {
      console.error('❌ EmailJS error response:', responseText);
      throw new Error(`EmailJS Error: ${response.status} - ${responseText}`);
    }

  } catch (error) {
    console.error('❌ Email service error:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to send OTP email. Please try again.' 
    };
  }
};

// Generate and store OTP
export const generateEmailOTP = async (email) => {
  try {
    console.log('🔐 Generating OTP for email:', email);
    
    if (!email || email.trim() === '') {
      throw new Error('Email address is required');
    }

    // Delete any existing OTPs for this email
    const q = query(collection(db, 'emailOTPs'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes to match template

    // Store in Firestore
    await addDoc(collection(db, 'emailOTPs'), {
      email: email.trim(),
      otp,
      expiresAt,
      createdAt: new Date()
    });

    // Send OTP via Email
    const emailResult = await sendOTPEmail(email.trim(), otp);
    
    if (!emailResult.success) {
      throw new Error(emailResult.message);
    }

    return otp;

  } catch (error) {
    console.error('❌ Error generating OTP:', error);
    throw error;
  }
};

// Verify OTP (update expiration time to 15 minutes)
export const verifyEmailOTP = async (email, enteredOtp) => {
  try {
    if (!email || !enteredOtp) {
      return { success: false, message: 'Email and OTP are required' };
    }

    const q = query(
      collection(db, 'emailOTPs'), 
      where('email', '==', email.trim()),
      where('otp', '==', enteredOtp)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, message: 'Invalid OTP' };
    }

    const otpData = querySnapshot.docs[0].data();
    
    // Check if OTP expired (15 minutes to match template)
    if (new Date() > otpData.expiresAt.toDate()) {
      await deleteDoc(querySnapshot.docs[0].ref);
      return { success: false, message: 'OTP expired' };
    }

    // Delete used OTP
    await deleteDoc(querySnapshot.docs[0].ref);
    
    return { success: true, message: 'OTP verified successfully' };

  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    return { success: false, message: 'Error verifying OTP' };
  }
};
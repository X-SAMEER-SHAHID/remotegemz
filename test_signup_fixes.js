// Test script to verify signup fixes
// This script tests both regular user and admin signup functionality

import { createClient } from '@supabase/supabase-js';

// You'll need to replace these with your actual Supabase credentials
// Option 1: Use environment variables (recommended)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Option 2: Manually set your credentials here
// const supabaseUrl = 'https://your-project-ref.supabase.co';
// const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRegularSignup() {
  console.log('Testing regular user signup...');
  
  const testEmail = 'sameershahid5911@gmail.com';
  const testPassword = '123456';
  
  try {
    // Test regular signup
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: undefined,
      },
    });
    
    if (error) {
      console.error('Regular signup failed:', error);
      return false;
    }
    
    console.log('Regular signup successful:', data.user?.id);
    
    // Complete the user signup process
    if (data.user) {
      console.log('Completing user signup process...');
      
      const { data: signupResult, error: signupError } = await supabase.rpc('complete_user_signup', {
        user_uuid: data.user.id
      });
      
      if (signupError) {
        console.error('Failed to complete user signup:', signupError);
        return false;
      } else {
        console.log('User signup completed successfully:', signupResult);
      }
    }
    
    return true;
  } catch (err) {
    console.error('Regular signup test error:', err);
    return false;
  }
}

async function testAdminSignup() {
  console.log('Testing admin signup...');
  
  const testEmail = 'shahidsameer418@gmail.com';
  const testPassword = '123456';
  const companyName = 'Shahid Sameer';
  
  try {
    // Test admin signup
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (error) {
      console.error('Admin auth signup failed:', error);
      return false;
    }
    
    console.log('Admin auth signup successful:', data.user?.id);
    
    if (data.user) {
      // Test admin creation using the function
      const { data: functionResult, error: functionError } = await supabase
        .rpc('create_admin_user', {
          p_user_id: data.user.id,
          p_company_name: companyName
        });
      
      if (functionError) {
        console.error('Admin creation function failed:', functionError);
        return false;
      }
      
      if (!functionResult || !functionResult.success) {
        console.error('Admin creation failed:', functionResult?.error);
        return false;
      }
      
      console.log('Admin creation successful:', functionResult);
    }
    
    return true;
  } catch (err) {
    console.error('Admin signup test error:', err);
    return false;
  }
}

async function runTests() {
  console.log('Starting signup tests...\n');
  
  const regularResult = await testRegularSignup();
  console.log(`Regular signup test: ${regularResult ? 'PASSED' : 'FAILED'}\n`);
  
  const adminResult = await testAdminSignup();
  console.log(`Admin signup test: ${adminResult ? 'PASSED' : 'FAILED'}\n`);
  
  console.log('Test summary:');
  console.log(`- Regular signup: ${regularResult ? '✅' : '❌'}`);
  console.log(`- Admin signup: ${adminResult ? '✅' : '❌'}`);
  
  if (regularResult && adminResult) {
    console.log('\n🎉 All tests passed! Signup issues have been resolved.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the error messages above.');
  }
}

// Run the tests
runTests().catch(console.error);

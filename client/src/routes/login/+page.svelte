<script lang="ts">
  import { onMount } from 'svelte';
  import * as InputOTP from '$lib/components/ui/input-otp/index.js';
  import { toast } from 'svelte-sonner';
  import { _axios } from '$lib/_axios';
  import * as Card from '$lib/components/ui/card';
  import * as Button from '$lib/components/ui/button';
  import * as Input from '$lib/components/ui/input';
  import { writableGlobalStore } from '$lib/stores/global-store'; 
  import { goto } from '$app/navigation'; // For navigation
  import { requestForToken } from '$lib/firebase';

  // Reactive state
  let mobile = $state('');
  let otp = $state('');
  let otpId = $state('');
  let referCode = $state('');
  let showOTPInput = $state(false);
  let showReferCodeInput = $state(false);
  let timer = $state(60);
  let canResendOTP = $state(false);
  let isSendingOTP = $state(false);
  let isVerifyingOTP = $state(false);
  let isLoggingIn = $state(false);
  let mobileError = $state('');
  let otpError = $state('');
  let referCodeError = $state('');
  let interval: NodeJS.Timeout | undefined;

  // Validate mobile number
  function validateMobile(): boolean {
    mobileError = '';
    
    // Remove any spaces or special characters
    const cleanMobile = mobile.replace(/\D/g, '');
    
    if (!cleanMobile) {
      mobileError = 'Mobile number is required';
      return false;
    }
    
    if (cleanMobile.length !== 10) {
      mobileError = 'Enter a valid 10-digit mobile number';
      return false;
    }
    
    // Check if it starts with valid digits (Indian mobile numbers)
    if (!/^[6-9]/.test(cleanMobile)) {
      mobileError = 'Enter a valid Indian mobile number';
      return false;
    }
    
    // Update mobile with clean number
    mobile = cleanMobile;
    return true;
  }

  // Validate OTP
  function validateOTP(): boolean {
    otpError = '';
    
    const cleanOTP = otp.replace(/\D/g, '');
    
    if (!cleanOTP) {
      otpError = 'OTP is required';
      return false;
    }
    
    if (cleanOTP.length !== 6) {
      otpError = 'Enter a valid 6-digit OTP';
      return false;
    }
    
    otp = cleanOTP;
    return true;
  }

  // Validate refer code (optional)
  function validateReferCode(): boolean {
    referCodeError = '';
    
    if (referCode && referCode.trim().length > 0) {
      const cleanReferCode = referCode.trim().toUpperCase();
      
      if (cleanReferCode.length < 3) {
        referCodeError = 'Refer code should be at least 3 characters';
        return false;
      }
      
      referCode = cleanReferCode;
    }
    
    return true;
  }

  // Real-time mobile validation
  function onMobileInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Limit to 10 digits
    if (value.length <= 10) {
      mobile = value;
    } else {
      mobile = value.slice(0, 10);
      target.value = mobile;
    }
    
    // Clear error when user starts typing
    if (mobileError) {
      mobileError = '';
    }
  }

  // Real-time OTP validation
  function onOTPInput() {
    // Clear error when user starts typing
    if (otpError) {
      otpError = '';
    }
  }

  // Real-time refer code validation
  function onReferCodeInput() {
    if (referCodeError) {
      referCodeError = '';
    }
  }

  // Send OTP
  async function sendOTP() {
    // console.log('sendOTP function called'); // Debug log
    
    if (!validateMobile()) {
      // console.log('Mobile validation failed'); // Debug log
      return;
    }

    isSendingOTP = true;
    
    try {
      console.log('Sending OTP to:', mobile); // Debug log
      
      const payload = { mobile: mobile };
      console.log('Payload:', payload); // Debug log
      
      const response = await _axios.post('/userauth/send-otp', payload);
      console.log('OTP Response:', response.data); // Debug log
      
      if (response.data && response.data.status) {
        otpId = response.data.otpId;
        showOTPInput = true;
        startTimer();
        toast.success('OTP sent successfully to ' + mobile);
      } else {
        const errorMessage = response.data?.message || 'Failed to send OTP';
        console.error('API Error:', errorMessage);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      isSendingOTP = false;
    }
  }

  // Verify OTP
  async function verifyOTP() {
    console.log('verifyOTP function called'); // Debug log
    
    if (!validateOTP()) {
      console.log('OTP validation failed'); // Debug log
      return;
    }

    isVerifyingOTP = true;
    
    try {
      console.log('Verifying OTP:', { otpId, otp }); // Debug log
      
      const payload = { otpId, otpNo: otp };
      const response = await _axios.post('/userauth/verify-otp', payload);
      
      console.log('Verify OTP Response:', response.data); // Debug log
      
      if (response.data && response.data.status) {
        toast.success('OTP verified successfully');
        
        // Clear the timer
        if (interval) {
          clearInterval(interval);
        }
        
        // Now proceed to login
        await performLogin();
      } else {
        const errorMessage = response.data?.message || 'Invalid OTP';
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      
      let errorMessage = 'Failed to verify OTP. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      isVerifyingOTP = false;
    }
  }

  // Perform login after OTP verification
  async function performLogin() {
   
    if (!validateReferCode()) {
     
      return;
    }

    isLoggingIn = true;
    
    try{
      const payload = { 
        mobile: mobile,
        referCode: referCode || ""
      };
      
      const response = await _axios.post('/userauth/login', payload);
      
      if (response.data && response.data.status) {
        const userData = response.data.data;
        
        // Update global store
        writableGlobalStore.update(store => ({
          ...store,
          userDetails: {
            profileImage: userData.userDetails.profileImage || '',
            userName: userData.userDetails.username || '',
            mobile: userData.userDetails.mobile || '',
          },
          isLogedIn: true,
        }));
        
        // Store in localStorage
        localStorage.setItem('token', userData.token);
        localStorage.setItem('_id', userData.userDetails.userId);
        localStorage.setItem('userData', JSON.stringify(userData.userDetails));
        
        
        // Handle FCM token if needed
        if (typeof window !== 'undefined') {
          try {
            console.log('Requesting FCM token...');
            const token = await requestForToken();
            if (token) {
              console.log('FCM token received:', token);
              toast.success('Notifications enabled');
            } else {
              console.warn('No FCM token received');
              toast.warning('Notifications may not work. Enable them in browser settings.');
            }
          } catch (error) {
            console.error('FCM token error:', error);
            toast.warning('Failed to enable notifications. Try again later.');
          }
        }
        
        toast.success(userData.newUser ? 'Welcome! Account created successfully.' : 'Login successful');
        
        // Navigate to dashboard
        goto('/');
      } else {
        const errorMessage = response.data?.message || 'Login failed';
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      isLoggingIn = false;
    }
  }

  // Start resend OTP timer
  function startTimer() {
    canResendOTP = false;
    timer = 60;
    
    if (interval) {
      clearInterval(interval);
    }
    
    interval = setInterval(() => {
      timer -= 1;
      if (timer <= 0) {
        clearInterval(interval);
        canResendOTP = true;
      }
    }, 1000);
  }

  // Handle Enter key press
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      if (!showOTPInput) {
        sendOTP();
      } else if (!showReferCodeInput) {
        verifyOTP();
      } else {
        performLogin();
      }
    }
  }

  // Resend OTP
  async function resendOTP() {
    otp = '';
    otpError = '';
    await sendOTP();
  }

  // Go back to mobile input
  function goBack() {
    showOTPInput = false;
    showReferCodeInput = false;
    otp = '';
    otpId = '';
    referCode = '';
    otpError = '';
    referCodeError = '';
    canResendOTP = false;
    
    if (interval) {
      clearInterval(interval);
    }
  }

  // Continue to refer code input (optional step)
  function continueToReferCode() {
    showReferCodeInput = true;
  }

  // Skip refer code and proceed to login
  function skipReferCode() {
    referCode = '';
    performLogin();
  }

  onMount(() => {
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  });
</script>

<svelte:window on:keydown={handleKeyPress} />

<main class="flex items-center justify-center min-h-[80vh] p-4">
  <Card.Root class="w-full max-w-md bg-white rounded-lg shadow-lg">
    <Card.Header class="text-center">
      <Card.Title class="text-2xl font-bold text-gray-900">Sign In</Card.Title>
      <Card.Description class="text-gray-600 mt-2">
        {#if !showOTPInput}
          Enter your mobile number to receive an OTP
        {:else if !showReferCodeInput}
          Enter the OTP sent to +91 {mobile}
        {:else}
          Enter referral code (optional)
        {/if}
      </Card.Description>
    </Card.Header>
    
    <Card.Content class="space-y-4">
      {#if !showOTPInput}
        <!-- Mobile Number Input -->
        <div class="space-y-2">
          <label for="mobile" class="block text-sm font-medium text-gray-700">
            Mobile Number
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-gray-500 text-sm">+91</span>
            </div>

            <Input.Root
              id="mobile"
              type="number"
              inputmode="numeric"
              placeholder="Enter 10-digit mobile number"
              maxlength="10"
              value={mobile}
              oninput={onMobileInput}
              class="pl-12 {mobileError ? 'border-red-500 focus:border-red-500' : ''}"
            />
          </div>
          {#if mobileError}
            <p class="text-red-500 text-sm flex items-center gap-1">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {mobileError}
            </p>
          {/if}
        </div>
        
        <Button.Root
          onclick={sendOTP}
          disabled={isSendingOTP || !mobile || mobile.length !== 10}
          class="w-full"
          variant="default"
        >
          {#if isSendingOTP}
            <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Sending OTP...
          {:else}
            Send OTP
          {/if}
        </Button.Root>
        
      {:else if !showReferCodeInput}
        <!-- OTP Input -->
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <button
              onclick={goBack}
              class="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Change Number
            </button>
          </div>
          
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700 text-center">
              Enter 6-digit OTP
            </label>
            <div class="flex justify-center">
              <InputOTP.Root 
                maxlength={6} 
                bind:value={otp} 
                oninput={onOTPInput}
              >
                {#snippet children({ cells })}
                  <InputOTP.Group class="flex gap-2">
                    {#each cells.slice(0, 3) as cell}
                      <InputOTP.Slot 
                        {cell} 
                        class="w-12 h-12 text-center text-lg border-2 {otpError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                      />
                    {/each}
                  </InputOTP.Group>
                  <InputOTP.Separator class="mx-2">
                    <div class="w-2 h-0.5 bg-gray-300"></div>
                  </InputOTP.Separator>
                  <InputOTP.Group class="flex gap-2">
                    {#each cells.slice(3, 6) as cell}
                      <InputOTP.Slot 
                        {cell} 
                        class="w-12 h-12 text-center text-lg border-2 {otpError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                      />
                    {/each}
                  </InputOTP.Group>
                {/snippet}
              </InputOTP.Root>
            </div>
            {#if otpError}
              <p class="text-red-500 text-sm text-center flex items-center justify-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                {otpError}
              </p>
            {/if}
          </div>
          
          <Button.Root
            onclick={verifyOTP}
            disabled={isVerifyingOTP || !otp || otp.length !== 6}
            class="w-full"
            variant="default"
          >
            {#if isVerifyingOTP}
              <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Verifying OTP...
            {:else}
              Verify OTP
            {/if}
          </Button.Root>
          
          <div class="text-center">
            {#if canResendOTP}
              <Button.Root
                onclick={resendOTP}
                disabled={isSendingOTP}
                variant="link"
                class="text-blue-600 hover:text-blue-800"
              >
                {#if isSendingOTP}
                  Resending...
                {:else}
                  Resend OTP
                {/if}
              </Button.Root>
            {:else}
              <p class="text-gray-600 text-sm">
                Resend OTP in <span class="font-medium text-blue-600">{timer}</span> second{timer !== 1 ? 's' : ''}
              </p>
            {/if}
          </div>
        </div>
        
      {:else}
        <!-- Referral Code Input -->
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <button
              onclick={() => showReferCodeInput = false}
              class="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
          
          <div class="space-y-2">
            <label for="referCode" class="block text-sm font-medium text-gray-700">
              Referral Code (Optional)
            </label>
            <Input.Root
              id="referCode"
              type="text"
              placeholder="Enter referral code"
              bind:value={referCode}
              oninput={onReferCodeInput}
              class="{referCodeError ? 'border-red-500 focus:border-red-500' : ''}"
            />
            {#if referCodeError}
              <p class="text-red-500 text-sm flex items-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                {referCodeError}
              </p>
            {/if}
          </div>
          
          <div class="space-y-2">
            <Button.Root
              onclick={performLogin}
              disabled={isLoggingIn}
              class="w-full"
              variant="default"
            >
              {#if isLoggingIn}
                <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Completing Login...
              {:else}
                Complete Login
              {/if}
            </Button.Root>
            
            <Button.Root
              onclick={skipReferCode}
              disabled={isLoggingIn}
              variant="outline"
              class="w-full"
            >
              Skip & Continue
            </Button.Root>
          </div>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</main>

<style>
  :global(.input-otp-slot:focus) {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
    outline: none;
  }
  
  :global(.input-otp-slot) {
    transition: all 0.2s ease;
  }
  
  :global(.input-otp-slot:hover) {
    border-color: #6b7280;
  }
</style>
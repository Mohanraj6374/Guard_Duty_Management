var vm = new Vue({
    el: '#Login',
    data: {
        countries: [
            { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
            { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
            { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
            { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
            { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
            { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971' },
            { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
            { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64' }
        ],
        selectedCountryCode: '+91',
        phone: '',

        phoneVerified: false,
        phoneError: '',
        showOtpWindow:false,
        isCheckingPhone:false,

        lastCheckedPhone:'',

        isSendingOtp: false,
        otpError:'',
        isVerifyingOtp: false,

        showOtp: false,

        otpTimeLeft: 300,
        otpTimer: null
    },
    watch: {
        selectedCountryCode() {
            this.phoneVerified = false;
        },

        phone() {
            this.phoneVerified = false;
        }
    },
    mounted() {

    },
    created() {

    },
    computed: {
        getSelectedCountry(){
            return this.countries.find(s => s.dialCode === this.selectedCountryCode) || this.countries[0];
        }
    },
    methods: {
        resetPhoneVerification(){
            this.phoneVerified = false;
            this.phoneError='';
            this.lastCheckedPhone='';
        },
        async checkPhoneNumber(){
            const mobileNo = this.phone.trim();


            this.phoneVerified = false;
            this.phoneError = '';

            if(!mobileNo){              
                this.phoneVerified = false;
                this.phoneError='';
                return;
            }

            if(this.isCheckingPhone){
                return;
            }

            if(this.lastCheckedPhone === mobileNo && this.phoneVerified){
                return;
            }

            this.isCheckingPhone = true;
            this.otpError = '';
            try{

                const response = await axios.get(
                    '/Login/CheckPhoneNumber',
                    {
                        params: {
                            mobileNo: mobileNo
                        }
                    }
                );
                const result = response.data;
                console.log('Verification response', result);

                if(result.statusCode === 200 && result.statusMessage === 'Success' && result.data && result.data.phoneNumber === mobileNo)
                {
                    this.phoneVerified = true;
                    this.phoneError = '';
                    this.lastCheckedPhone = mobileNo;
                }else{
                    this.phoneError = "Invalid phone number.";
                    console.log("Invalid phone number entered.");
                }
            }catch(error){
                console.error("Phone number verification failed: ", error.message );
                this.phoneError = "Unable to verify mobile number. Please try again.";
            }finally{
                this.isCheckingPhone = false;
            }
        },
        async sendOtp() {

            if (this.isSendingOtp) return;

            if(!this.phone.trim()){
                this.phoneError = "Enter phone number.";
                return;
            }
            if(!this.phoneVerified){
                this.phoneError = 'Please verify your mobile number first.';
                return;
            }


            this.isSendingOtp = true;


            try{
                const response = await axios.post("/Login/SendOtp",
                {
                    countryCode: String(this.selectedCountryCode).replace('+',''),
                    phoneNumber: this.phone.trim()
                });

                const result =  response.data;
                console.log("Send otp response: ", response.data);

                if(result.statusCode === 200 && result.statusMessage === 'Success'){
                    this.showOtpWindow = true;
                    this.startOtpTimer();
                }else{
                    this.otpError = "Unable to send OTP. Please try again.";
                }
            }catch(error){
                console.error("Send OTP error: ",error.response?.data || error.message);
                this.otpError = error.response?.data?.message || "Unable to send OTP. Please try again.";
            }finally{
                this.isSendingOtp = false;
            }


        },
        async verifyOtp() {

            if (this.isVerifyingOtp) {
                return;
            }
            const inputs = this.getOtpInputs();

            const otp = Array.from(inputs).map(input=>input.value).join('');

            if (otp.length !== 6 || !/^\d{6}$/.test(otp)){
                this.otpError = "Please enter the complete 6-digit OTP.";
                return;
            }
            this.isVerifyingOtp = true;
            this.otpError ='';
            try{
                const response = await axios.post('/Login/VerifyOtp', {
                    countryCode: String(this.selectedCountryCode).replace('+',''),
                    phoneNumber: this.phone.trim(),
                    otp: otp
                });

                const result = response.data;
                console.log('Verify OTP response',result);

                // if(response.status === 200 && response.statusCode === 200 && result.statusMessage==='Success'){
                //     console.log('OTP Verified Successfully.');
                // }else{
                //     this.otpError = result.statusMessage || 'Inavlid or expired OTP.';
                // }
                if(result.success === true && result.redirectUrl){
                    console.log("OTP verified successfully");

                    console.log("Redirect URL:", result.redirectUrl);
                    console.log("Current URL:", window.location.href);
                    window.location.assign(result.redirectUrl);

                    console.log('Redirect command executed.');
                }else{
                    this.otpError = result.message || "Invalid or expired OTP.";
                }
            }catch(error){
                console.error('Verify OTP error: ', error.response?.data || error.message);
                const errorResponse = error.response?.data;
                this.otpError = errorResponse?.statusMessage || errorResponse?.message || "Unable to verify OTP. Try again.";
            }finally{
                this.isVerifyingOtp = false;
            }
        },

        getOtpInputs(){
            const container = document.getElementById('otpInputsContainer');
            return  container ? container.querySelectorAll('.otp-box'):[];
        },

        handleOtpInput(index, browserEvent){
            const input = browserEvent.target;

            const digit = input.value.replace(/\D/g,"").slice(-1);

            input.value = digit;

            const inputs = this.getOtpInputs();

            if(digit && index<inputs.length-1){
                
                 inputs[index+1].focus();
            }
        },

        handleOtpBackspace(index){
            const inputs = this.getOtpInputs();

            if(index >= inputs.length){
                return;
            }

            if(!inputs[index].value && index>0){
                inputs[index-1].focus();
            }
        },
        handleOtpPaste(browsersEvent){
            
            browsersEvent.preventDefault();

            const pastedText = browsersEvent.clipboardData || window.clipboardData;

            const digits = pastedText.getData('text').replace(/\D/g, '').slice(0, 6);

            const inputs = this.getOtpInputs();
            // console.log('Target object:', this.getOtpInputs()); Replace with your actual variable
            if(!inputs.length){
                return;
            }
   
            for (let i = 0; i < digits.length; i++) {
                inputs[i].value = digits[i] ||'';
            }


            // Clear any boxes not filled by the pasted text
            // for (let i = digits.length; i < 6; i++) {
            //     this.$refs.otpInputs[i].value = '';
            // }

            const nextIndex = Math.min(digits.length, inputs.length-1);

            
            inputs[nextIndex].focus();
                
        },

        startOtpTimer(){
            clearInterval(this.otpTimer);

            this.otpTimeLeft = 300;

            this.otpTimer = setInterval(()=>{
                if(this.otpTimeLeft > 0){
                    this.otpTimeLeft--;
                }else{
                    clearInterval(this.otpTimer);
                    this.otpTimer=null;
                }
            }, 1000);
        },

        formatOtpTime(){
            const minutes = Math.floor(this.otpTimeLeft/60);
            const seconds = this.otpTimeLeft%60;
            return (String(minutes).padStart(2,'0') + ":" +String(seconds).padStart(2,'0'));
        },
        stopOtpTimer(){
            clearInterval(this.otpTimer);
            this.otpTimer=null;
        }
        

    },
    beforeDestroy() {
        this.stopOtpTimer();
    },
});
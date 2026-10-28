Vue.component('app-header', {
    data(){
        return{
            username: window.GuardUserEmail || 'GuardUserName',


            currentDateTime: '',
            dateTimeInterval: null
        };
    },
    template: `
        <div class="container-fluid bg-main p-0" id="app-header" v-cloak>
            <header class="bg-black text-white px-3 px-lg-4 py-2">
                <div class="row align-items-center g-2">

                    <!-- Logo -->
                    <div class="col-4 col-md-3">
                        <a href="#" class="d-inline-block">
                            <img src="/MSS_logo.png"
                                 alt="MSS Security Logo"
                                 class="img-fluid"
                                 style="max-width: 115px; max-height: 60px; object-fit: contain;">
                        </a>
                    </div>

                    <!-- Date, Time and Guard Profile -->
                    <div class="col-8 col-md-9">
                        <div class="d-flex justify-content-end align-items-center gap-3 gap-lg-4 flex-wrap">

                            <!-- Live Date and Time -->
                            <div class="d-flex align-items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg"
                                     width="16" height="16" fill="currentColor"
                                     class="bi bi-clock flex-shrink-0"
                                     viewBox="0 0 16 16">
                                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z" />
                                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0" />
                                </svg>

                                <span id="headerDateTime" class="fw-semibold text-nowrap font-size-7">
                                    {{ currentDateTime }}
                                </span>
                            </div>

                            <!-- Guard Profile -->
                            <div class="dropdown">
                                <button class="dropdown-btn dropdown-toggle fw-semibold"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-person-circle" viewBox="0 0 16 16">
                                          <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                                          <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
                                        </svg>
                                    
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li>
                                        <span class="p-2">{{ username }}</span>
                                    </li>
                                
                                    <li>
                                        <hr class="dropdown-divider">
                                    </li>
                                
                                    <li>
                                        <button type="button" class="dropdown-item" @click="logout()">
                                            Logout 
                                        </button>
                                    </li>
                                </ul>
                            </div>

                        </div>
                    </div>

                </div>
            </header>
        </div>
    `,
    methods: {
        updateHeaderDateTime(){
            const now = new Date();

            this.currentDateTime = now.toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        },

        async logout() {

            
            try {
                const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value;

                

                const response = await axios.post('/Login/Logout', {}, {
                    headers: {
                        RequestVerificationToken: token
                    }
                });

                if (response.data.success && response.data.redirectUrl) {
                    window.location.href = response.data.redirectUrl;
                }
            } catch (error) {
                console.error('Logout failed: ', error.response?.data || error.message);
            }
        }
    },

    mounted() {
        this.updateHeaderDateTime();
        this.dateTimeInterval = setInterval(() => {
            this.updateHeaderDateTime();
        },60000)
    },
    beforeDestroy() {
        clearInterval(this.dateTimeInterval);
    }
});

Vue.component('app-header', {                        
    data(){
        return{
            username: window.GuardUserEmail || 'Guard',


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
                            <div class="d-none d-sm-flex align-items-sm-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg"
                                     width="16" height="16" fill="currentColor"
                                     class="bi bi-clock flex-shrink-0 align-middle"
                                     viewBox="0 0 16 16">
                                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z" />
                                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0" />
                                </svg>

                                <span id="headerDateTime" class="fw-semibold  align-middle text-nowrap font-size-7">
                                    {{ currentDateTime }}
                                </span>
                            </div>
                            <!-- Guard Name -->
                            

                            <!-- Guard Profile -->
                            <div class="dropdown">
                                
                                <button class="dropdown-toggle dropdown-btn fw-semibold"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-person-circle" viewBox="0 0 16 16">
                                          <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                                          <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
                                        </svg>
                                    
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end px-2">
                                    <li>
                                        <div class="d-flex flex-row gap-2 align-items-center">
                                            <div class="d-flex align-items-center justify-content-center rounded-circle" style="width: 48px; height: 48px; background: #F5EBD0;">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#80652B" class="bi bi-person-check" viewBox="0 0 16 16">
                                                  <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m1.679-4.493-1.335 2.226a.75.75 0 0 1-1.174.144l-.774-.773a.5.5 0 0 1 .708-.708l.547.548 1.17-1.951a.5.5 0 1 1 .858.514M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>
                                                  <path d="M8.256 14a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z"/>
                                                </svg>
                                            </div>
                                            <div class="p-1">
                                                <p class="mb-0 font-size-8">SIGNED IN AS</p>
                                                <p class="mb-0 py-2 fs-6 fw-semibold lh-1">{{ username }}</p>
                                            </div>
                                        </div>
                                        
                                    </li>
                                
                                    <li>
                                        <hr class="dropdown-divider">
                                    </li>

                                    <li>                                        
                                        <span id="headerDateTime" class="p-2 d-sm-none d-block text-nowrap font-size-9">
                                            {{ currentDateTime }}
                                        </span>
                                    </li>
                                    <li>
                                        <hr class="dropdown-divider d-sm-none">
                                    </li>
                                    <li>
                                        <button type="button" class="dropdown-item p-2" v-on:click="logout()">
                                            <div class="d-flex align-items-center justify-content-between security-text">
                                                
                                                <span class="align-middle fw-semibold security-text fs-6 lh-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-box-arrow-right align-middle" viewBox="0 0 16 16">
                                                      <path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
                                                      <path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
                                                    </svg>
                                                    Logout
                                                </span>
                                                
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-arrow-up-right align-middle" viewBox="0 0 16 16">
                                                  <path fill-rule="evenodd" d="M14 2.5a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0 0 1h4.793L2.146 13.146a.5.5 0 0 0 .708.708L13 3.707V8.5a.5.5 0 0 0 1 0z"/>
                                                </svg>
                                            </div>
                                        </button>
                                    </li>
                                </ul>

                                <div class="d-none d-sm-flex align-items-sm-center gap-2 me-n3">
                                    <span id="headerDateTime" class="fw-semibold  align-middle text-nowrap font-size-7">
                                        {{ username.split('@')[0] }}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </header>
        </div>
    `,
    mounted() {
        this.updateHeaderDateTime();
        this.dateTimeInterval = setInterval(() => {
            this.updateHeaderDateTime()
        }, 1000);
    },
    methods: {
        updateHeaderDateTime(){
            this.currentDateTime = moment().format(
                "DD MMM YYYY | hh:mm:ss A"
            );
            // this.currentDateTime = now.toLocaleString('en-US', {
            //     weekday: 'short',
            //     month: 'short',
            //     day: '2-digit',
            //     year: 'numeric',
            //     hour: 'numeric',
            //     minute: '2-digit',
            //     hour12: true
            // });
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
        if (this.dateTimeInterval) {
            clearInterval(this.dateTimeInterval);
            this.dateTimeInterval = null;
        }
    }
});

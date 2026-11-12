Vue.component('toast-notification', {
    data(){
        return {
            notifications: [],
            nextId:1
        }
    },
    template: `
        <div class="toast-container">
            <div name="toast-slide">
                <div v-for="toast in notifications"
                    :key="toast.id"
                    class="toast-notification mb-2"
                    :class='"toast-"+toast.type'
                    role="status"
                    aria-live="polite">
                    <div class="toast-content d-flex align-items-center justify-content-between gap-2 p-2">
                        <div class="d-flex align-items-center gap-2">
                            <div class="toast-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#00d048ff" class="bi bi-check-circle-fill" v-if="toast.type==='success'" viewBox="0 0 16 16">
                                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                                </svg>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ff0000ff" class="bi bi-x-circle-fill" v-if="toast.type==='error'" viewBox="0 0 16 16">
                                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"/>
                                </svg>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ffd800ff" class="bi bi-exclamation-circle-fill" v-if="toast.type==='warning'" viewBox="0 0 16 16">
                                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
                                </svg>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#0094ffff" class="bi bi-info-circle-fill" v-if="toast.type==='info'" viewBox="0 0 16 16">
                                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
                                </svg>
                            </div>
                            <div class="toast-message border-0 border-right">
                                {{toast.message}}
                            </div>
                        </div>
                        <button type="button" class="toast-close" v-on:click="removeToast(toast.id)">
                            <p class="m-0 mb-1 p-0 lh-1">&times;</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    created() {
        ToastService.eventBus.$on('show-toast', this.showToast);
    },
    beforDestroy() {
        ToastService.eventBus.$off('show-toast', this.showToast);
        this.notifications.forEach(toast => {
            clearTimeout(toast.timer);
        });
    },
    methods: {
        showToast(options) {
            const toast = {
                id: this.nextId++,
                message: options.message,
                type: options.type,
                timer: null
            };
            this.notifications.push(toast);

            if (options.duration > 0) {
                toast.timer = setTimeout(() => {
                    this.removeToast(toast.id);
                }, options.duration);
            }

        },
        removeToast(id) {
            const index = this.notifications.findIndex(
                toast => toast.id === id
            );

            if (index === -1) return;
            clearTimeout(this.notifications[index].timer);
            this.notifications.splice(index, 1);
        }
    }
});
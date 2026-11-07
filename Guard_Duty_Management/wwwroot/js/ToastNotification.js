Vue.component('toast-notification', {
    data(){
        return {
            notifications: [],
            nextId:1
        }
    },
    template: `
        <div class="toast-container">
            <transition-group name="toast-slide" tag="div">
                <div v-for="toast in notifications"
                    :key="toast.id"
                    class="toast-notification mb-2 border"
                    :class='"toast-"+toast.type'
                    role="status"
                    area-live="polite">
                    <div class="toast-content d-flex align-items-center gap-2 p-3">
                        <div class="toast-icon">
                            {{toast.type==='success'?'✓':
                                toast.type==='error'?'✕':
                                toast.type==='warning'?'⚠️':'¡'}}
                        </div>
                        <div class="toast-message border-0 border-right">
                            {{toast.message}}
                        </div>
                        <button type="button" class="toast-close" v-on:click="removeToast(toast.id)">
                            &times;
                        </button>
                    </div>
                </div>
            </transition-group>
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
                timer: options.timer
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
                t => t.id === id
            );
            if (index == -1) return;
            clearTimeout(this.notifications[index].timer);
            this.notifications.splice(index, 1);
        }
    }
});
//Central Toast Notification Service
window.ToastService = {
    eventBus: new Vue(),

    //Success Notification
    success(message, duration = 4000) {
        this.show(message, 'success', duration);
    },
    //Error Notification
    error(mrssage, duration = 4000) {
        this.show(message, 'error', duration);
    },
    //Info Notification
    info(message, duration = 4000) {
        this.show(message, 'info', duration);
    },
    //warning notification
    warning(message, duration = 4000) {
        this.show(message, 'warning', duration);
    },
    //common notification
    show(message, type, duration) {
        this.eventBus.$emit("show-toast", {
            message: message,
            type: type,
            duration: duration
        });
    }

};
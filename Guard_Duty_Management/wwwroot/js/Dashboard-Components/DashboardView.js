var vm = new Vue({
    el: '#DashboardView',
    data() {
        return{

            selectedDate: moment().format("YYYY-MM-DD"),


            showClockInForm: false,
            showAddTaskForm: false,
            searchText:''

        };
    },
    created() {
        console.log("Today's date:", this.selectedDate);
    },
    
    methods: {

    }
});
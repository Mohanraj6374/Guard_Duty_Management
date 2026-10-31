var vm = new Vue({
    el: '#DashboardView',
    data() {
        return{

            selectedDate: moment().format("YYYY-MM-DD"),
            
            clockLogs:[],
            clockInStatus: false,
            clockInSwitch: false,
            showClockInForm: false,
            showAddTaskForm: false,
            searchText: '',

            clockIn: {
                siteId:'',
                siteId: '',
                shiftId: '',
                guardPostId:''
            },

            addTask: {
                siteId: '',
                taskId: ''
            },

            siteOptions: [
                { id: 1, text: 'Site 1' },
                { id: 2, text: 'Site 2' },
                { id: 3, text: 'Site 3' },
                { id: 4, text: 'Site 4' }
            ],

            taskOptions: [
                { id: 1, text: 'Task 1' },
                { id: 2, text: 'Task 2' },
                { id: 3, text: 'Task 3' },
                { id: 4, text: 'Task 4' }
            ],
            shiftOptions: [
                { id: 1, text: 'Shift 1' },
                { id: 2, text: 'Shift 2' },
                { id: 3, text: 'Shift 3' },
                { id: 4, text: 'Shift 4' }
            ],
            guardPostOptions: [
                { id: 1, text: 'Post 1' },
                { id: 2, text: 'Post 2' },
                { id: 3, text: 'Post 3' },
                { id: 4, text: 'Post 4' }
            ]

        };
    },
    created() {
        console.log("Today's date:", this.selectedDate);
    },
    
    methods: {


        confirmClockIn  () {
            this.clockInStatus = true;
            this.clockInSwitch = true;

            this.showClockInForm = false;

            
        },

        closeClockInForm() {
                this.showClockInForm = false;
                this.clockInSwitch = false;
        },
        handleClockInToggle() {
            if (this.clockInSwitch && !this.clockInStatus) {
                this.showClockInForm = true;
                
            }
            else if (!this.clockInSwitch && this.clockInStatus) {
                this.clockInStatus = false;
                this.showClockInForm = false;
            }
        },

        openAddTaskForm() {
            this.showAddTaskForm = true;
            
        }
    },
    mounted() {

        // $('.select2-dropdown').select2({
        //     placeholder: "Select an option",
        //     allowClear: true,
        //     width: '100%'
        // });

    }
});
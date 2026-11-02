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
                taskId: '',
                date: '',
                startTime: '',
                endTime: ''
            },

            siteOptions: [],

            taskOptions: [],

            shiftOptions: [],
            guardPostOptions: [],

            assignedTaskList: [],

            selectedExecutionTask: null
            

        };
    },
    created() {
        console.log("Today's date:", this.selectedDate);

        this.loadDashboardData();
    },
    
    methods: {
        async loadDashboardData() {

            try {

                const response = await axios.get('/data/dashboard-data.json');

                const data = await response.data;

                this.siteOptions = data.sites.map(site => ({
                    id: site.siteId,
                    text: site.siteName
                }));

                this.taskOptions = data.tasks.map(task => ({
                    id: task.taskId,
                    text: task.taskName
                }));

                this.shiftOptions = data.shifts.map(shift => ({
                    id: shift.shiftId,
                    text: shift.shiftTime
                }));
                this.guardPostOptions = data.guardposts.map(guardpost => ({
                    id: guardpost.guardpostId,
                    text: guardpost.guardpostName
                }));

            }
            catch (error) {
                console.error("Error loading dashboard data:", error);
            }

        },

        assignTask() {

            if (!this.addTask.siteId || !this.addTask.taskId || !this.addTask.date || !this.addTask.startTime || !this.addTask.endTime) {
                alert('Please fill all required fields.')
                return;
            }

            selectedSite = this.siteOptions.find(site => site.id == this.addTask.siteId);
            selectedTask = this.taskOptions.find(task => task.id == this.addTask.taskId);

            if (!selectedSite || !selectedTask) {
                alert('Invalid Site or Task selection.')
                return;
            }


            const task = {
                assignmentId: Date.now(),
                siteId: this.addTask.siteId,
                siteName: selectedSite.text,

                taskId: this.addTask.taskId,
                taskName: selectedTask.text,

                date: this.addTask.date,
                startTime: this.addTask.startTime,
                endTime: this.addTask.endTime,

                guardTaskStartTime: null,
                guardTaskEndTime: null,
                totalDuration: 0

            }
            this.assignedTaskList.push(task);
            console.log("Task Assigned");


            //reset form
            this.addTask = {
                siteId: '',
                taskId: '',
                date: '',
                startTime: '',
                endTime:''
            }

            this.showAddTaskForm = false;

        },

        selectExecutionTask(task) {
            this.selectedExecutionTask = task;
            
        },

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
            
        },
        closeAddTaskForm() {
            this.showAddTaskForm = false;

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
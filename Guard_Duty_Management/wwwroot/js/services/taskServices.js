const taskService = {
    getTasks() {
        return axios.get('/data/tasks.json');
    }
};

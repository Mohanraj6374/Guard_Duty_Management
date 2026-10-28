Vue.component('select2', {
    props: ['value', 'options', 'placeholder'],

    template: `
        <select class="form-select" style="width:100%">
            <option value=""></option>
            <option v-for="i in options"
                :key="i.id"
                :value="i.id">
                {{i.text}}
            </option>
        </select>
    `,
    mounted() {
        const vm = this;

        $(this.$el).select2({
            placeholder: this.placeholder,
            allowClear: true,
            width: '100%'
        }).val(this.value)
            .trigger('change.select2')
            .on('change', function () {
                vm.$emit('input', $this.val());
            });
    },
    beforeDestroy() {
        $(this.$el).off().select2('destroy');
    }
});

Vue.component('select2', {
    props: {
        value: {
            default: ''
        },
        options: {
            type: Array,
            default: () => []
        },
        placeholder: {
            type: String,
            default: 'Select an option'
        },
        allowClear: {
            type: Boolean,
            default: true
        },
        disabled: {
            type: Boolean,
            default: false
        }
    },

    template: `
        <select class="form-select">
            <option value=""></option>
            <option v-for="option in options"
                    :key="option.id"
                    :value="option.id">
                {{ option.text }}
            </option>
        </select>
    `,

    mounted() {
        this.initializeSelect2();
    },

    methods: {
        initializeSelect2() {
            const self = this;

            $(this.$el).select2({
                placeholder: this.placeholder,
                allowClear: this.allowClear,
                width: '100%',
                disabled: this.disabled,
                dropdownParent: $(this.$el).closest('.popup-form')
            });

            $(this.$el).val(this.value).trigger('change.select2');

            $(this.$el).on('change', function () {
                self.$emit('input', $(this).val());
            });
        }
    },

    watch: {
        value(newValue) {
            $(this.$el).val(newValue).trigger('change.select2');
        },

        options() {
            this.$nextTick(() => {
                
                $(this.$el).val(this.value).trigger('change.select2');
            });
        },

        disabled(newValue) {
            $(this.$el).prop('disabled', newValue);
        }
    },

    beforeDestroy() {
        $(this.$el).off('.vueSelect2');

        if ($(this.$el).hasClass('select2-hidden-accessible')) {
            $(this.$el).select2('destroy');
        }
    }
});

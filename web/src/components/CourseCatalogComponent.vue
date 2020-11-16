<template>
    <div class="catalog-container">
        <div v-for="item in courses || []" :key="item.id">
            <CourseComponent :courseid="item.id"></CourseComponent>
        </div>
    </div>
</template>

<script>
import {mapGetters} from 'vuex';
import CourseComponent from '@/components/CourseComponent';

export default {
    name: 'CourseCatalogComponent',
    components: {CourseComponent},
    computed: {
        ...mapGetters({
            courses: 'getCourses'
        })
    }
};
</script>

<style scoped lang="scss">
    .catalog-container {
        margin-top: 100px;
    }
</style>

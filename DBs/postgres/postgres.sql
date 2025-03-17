create table universities (
    id serial primary key,
    name varchar(255) not null
);
create table institutes (
    id serial primary key,
    name varchar(255) not null,
    university_id integer not null,
    foreign key (university_id) references universities(id)
);
create table departments (
    id serial primary key,
    name varchar(255) not null,
    institute_id integer not null,
    foreign key (institute_id) references institutes(id)
);
create table groups (
    id serial primary key,
    name varchar(255) not null,
    department_id integer not null,
    foreign key (department_id) references departments(id)
);
create table students (
    id serial primary key,
    fio varchar(255) not null,
    group_id integer not null,
    foreign key (group_id) references groups(id)
);
create table specialities (
    id serial primary key,
    name varchar(255) not null,
    department_id integer
);
create table courses (
    id serial primary key,
    name varchar(255) not null,
    year smallint not null,
    term smallint not null,
    department_id integer not null,
    foreign key (department_id) references departments(id),
    speciality_id integer not null,
    foreign key (speciality_id) references specialities(id)
);
create table lessons (
    id serial primary key,
    name varchar(255) not null,
    tech_equipment boolean not null,
    course_id integer not null,
    foreign key (course_id) references courses(id)
);
create table schedules (
    id serial primary key,
    start_time timestamp not null,
    lesson_id integer not null,
    foreign key (lesson_id) references lessons(id),
    group_id integer not null,
    foreign key (group_id) references groups(id)
);
create table attendance (
    id serial primary key,
    attendance_date date not null,
    student_id integer not null,
    foreign key (student_id) references students(id),
    schedule_id integer not null,
    foreign key (schedule_id) references schedules(id)
);
create table materials (
    id serial primary key,
    lesson_id integer not null,
    foreign key (lesson_id) references lessons(id)
);

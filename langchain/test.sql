
id, name, age, gender, city, salary
1, John, 25, Male, New York, 50000
2, Jane, 30, Female, Los Angeles, 60000
3, Jim, 35, Male, Chicago, 70000
4, Jill, 40, Female, Houston, 80000
5, Jack, 45, Male, Miami, 90000
update table set salary = 100000 where id = 1;
delete from table where id = 2;
select * from table where salary > 70000;
select * from table where gender = 'Male';
select * from table where city = 'New York' and salary > 50000;
SELECT * FROM TABLE WHERE CITY = 'LOS ANGELES' OR CITY = 'CHICAGO';

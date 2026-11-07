# VacationAgent

סוכן תכנון טיולים עם ידע מצטבר ופרויקט עצמאי לכל טיול.

- [הסוכן והכלים](agent/AGENTS.md)
- [טיולים](trips/AGENTS.md)
- [העדפות ולמידה](knowledge/AGENTS.md)
- [פתיחת טיול חדש](.agents/skills/new-trip/SKILL.md)
- [תחילת עבודה](agent/docs/QUICKSTART_HE.md)

```bash
npm install
npm run init
npm run dashboard
npm run validate
npm test
npm run build
```

כל הפקודות רצות מהשורש. פקודות טיול מקבלות `-- --trip <id>`; הטיול הפעיל מוגדר ב־agent/config/travel-agent.yaml.

```bash
npm run trip:new -- --trip my-trip --name "טיול חדש" --timezone Europe/Bucharest --start 2027-04-01 --end 2027-04-05
npm run validate -- --trip my-trip
npm run export:mymaps -- --trip my-trip
npm run export:plan-html -- --trip my-trip --local-only
```

כל מסד נתונים נמצא ב־trips/<id>/data. רשימת הטיולים נגזרת מ־trip.json. פתיחת טיול אינה מפעילה כתיבות חיצוניות.
בוקרשט הוא שלד תכנון; אזהרות על ימים שעדיין לא תוכננו צפויות. פערים היסטוריים בטיול שהושלם מתועדים בפרויקט שלו.

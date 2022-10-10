import express from "express"
import morgan from "morgan"
import session from "express-session";
import MongoStore from "connect-mongo";
import rootRouter from "./routers/rootRouter";
import userRouter from "./routers/userRouter";
import videoRouter from "./routers/videoRouter";
import { localMiddleware } from "./middlewares";


const app = express();

// 라우팅은 꼭 이 공간에서 작성해야 한다. 

const logger = morgan("dev")

app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");

app.use(logger);
app.use(express.urlencoded({extended: true}));

// 세션
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        // 2시간 유효
        maxAge: 2000000,
    },
    store: MongoStore.create({mongoUrl: process.env.DB_URL},)
}))

// // 테스트로 세션 출력해 보기
// app.use((req, res, next) => {
//     req.sessionStore.all((error, sessions) => {
//         console.log(sessions);
//         next();
//     })
// })

app.use(localMiddleware);
app.use("/uploads/", express.static("uploads"));
app.use("/static", express.static("assets"));

// 글로벌 라우터
app.use("/", rootRouter); 
app.use("/users", userRouter);
app.use("/videos", videoRouter);

export default app;






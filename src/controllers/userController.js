import User from "../models/User";
import fetch from "cross-fetch";
import bcrypt from "bcrypt";

export const getJoin = (req, res) => res.render("join", {pageTitle: "Join"});
export const postJoin = async (req, res) => {
    const {email, username, password, password2, name, location} = req.body;
    const pageTitle = "Join";
    if (password !== password2) {
        return res.status(400).render("join", {
            pageTitle,
            errorMessage: "Password confirmation does not match!",
        });
    }
    const exists = await User.exists({$or: [{username}, {email}]});
    if (exists) {
        return res.status(400).render("join", {
            pageTitle,
            errorMessage: "This username/email is already taken.",
        });
    }
    try {
        await User.create({
            email,
            username,
            password,
            name,
            location,
        });
        return res.redirect("/login")
    } catch (error) {
        return res.status(400).render("join", {
            pageTitle,
            errorMessage: error._message,
        })
    }
};
export const getLogin = (req, res) => res.render("login", {
    pageTitle: "Login",
});

export const postLogin = async (req, res) => {
    const {username, password} = req.body;
    const pageTitle = "Login"
    // check if account exists
    const user = await User.findOne({username, socialOnly: false});
    if (!user) {
        return res.status(400).render("login", {
            pageTitle,
            errorMessage: "An account with this username does not exists.",
        });
    }

    // check if password is correct. 
    const ok = await bcrypt.compare(password, user.password);
    if (!ok){
        return res.status(400).render("login", {
            pageTitle,
            errorMessage: "Wrong password!",
        });
    }
    // 로그인 유저 세션에 저장.
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
}

// 깃헙에 GET 방식으로 최초 승인요청
export const startGithubLogin = (req, res) => {
    const baseURL = "https://github.com/login/oauth/authorize"
    const config = {
        client_id: process.env.GH_CLIENT,
        allow_signup: false,
        scope: "read:user user:email",
    }
    const params = new URLSearchParams(config).toString();
    const finalURL = `${baseURL}?${params}`;

    return res.redirect(finalURL);
}

// Promise 방식이 아닌 .then() 방식으로 아래 finishGithubLogin 을 작성
export const finishGithubLoginBythen = (req, res) => {
    const baseURL = "https://github.com/login/oauth/access_token" 
    const config = {
        client_id: process.env.GH_CLIENT,
        client_secret: process.env.GH_SECRET,
        code: req.query.code,
    };
    const params = new URLSearchParams(config).toString();
    const finalURL = `${baseURL}?${params}`;
    fetch(finalURL, {
        method: "POST",
        headers: {
            Accept: "application/json",
        },
    }).then(response => response.json()).then(tokenRequest => {
        if ("access_token" in tokenRequest) {
            const {access_token} = tokenRequest;
            const apiUrl = "https://api.github.com";
            fetch(`${apiUrl}/user`, {
                headers: {
                    Authorization: `token ${access_token}`,
                },
            }).then(response => response.json()).then(userData => {

                fetch(`${apiUrl}/user/emails`, {
                    headers: {
                        Authorization: `token ${access_token}`,
                    },
                }).then(response => response.json()).then(emailData => {
                    res.end()
                })
            })
        }
    })
}


// 깃헙에서 POST 방식으로 code 받기
export const finishGithubLogin = async (req, res) => {
    const baseURL = "https://github.com/login/oauth/access_token" 
    const config = {
        client_id: process.env.GH_CLIENT,
        client_secret: process.env.GH_SECRET,
        code: req.query.code,
    };
    const params = new URLSearchParams(config).toString();
    const finalURL = `${baseURL}?${params}`;
    const tokenRequest = await (
        await fetch(finalURL, {
            method: "POST",
            headers: {
                Accept: "application/json",
        },
    })).json();

    // 만약 액세스 토큰을 받는데 성공했다면 GET 방식으로 user의 정보를 요청
    if ("access_token" in tokenRequest) {
        const {access_token} = tokenRequest;
        const apiUrl = "https://api.github.com";
        const userData = await (
            await fetch(`${apiUrl}/user`, {
                headers: {
                    Authorization: `token ${access_token}`,
                },
            })
        ).json();
        const emailData = await (
            await fetch(`${apiUrl}/user/emails`, {
                headers: {
                    Authorization: `token ${access_token}`,
                },
            })
        ).json()
        // 배열로 넘겨받은 이메일 중 대표이메일 선별하기
        const emailObj = emailData.find(
            (email) => email.primary === true && email.verified === true
        );
        // 이메일이 없으면 로그인 페이지로 넘기기.
        if(!emailObj){
            return res.redirect("/login");
        }
        // 로그인 시켜주기
        let user = await User.findOne({email: emailObj.email});

        // DB에 없다면 계정 생성하고 로그인해 주기
        if (!user){
            // create an account
            user = await User.create({
                avatarUrl: userData.avatar_url,
                name: userData.name,
                username: userData.login,
                email: emailObj.email,
                password: "",
                socialOnly: true,
                location: userData.location,
            })

        }

        // 만약 이미 이메일 주소가 DB에 있다면 그냥 로그인시켜 주기.
        req.session.loggedIn = true;
        req.session.user = user;
        return res.redirect("/")

    } else{
        return res.redirect("/login");
    }
};


export const edit = (req, res) => res.send("Edit User");
export const getEdit = (req, res) => {
    return res.render("edit-profile", {
        pageTitle: "Edit Profile"});
}

// 프로필 수정
export const postEdit = async (req, res) => {

    const {
        session: {
            user: {_id, avatarUrl},
        },
        body: {name, email, username, location},
        file,
    } = req;

    // 사용자가 username 을 변경하려고 한다면 
    if (req.session.user.username !== username) {
        // username 이 DB상 존재하는지 알아보자.
        const existsUsername = await User.exists({username});
        // username이 존재한다면,
        if (existsUsername) {
            return res.status(400).render("edit-profile", {
                pageTitle: "Edit Profile",
                // 에러 메세지 주기
                errorMessage: "User already taken",
            })
        }
    }

    if (req.session.user.email !== email) {
        // email 이 DB상 존재하는지 알아보자.
        const existsEmail = await User.exists({email});

        // email이 이미 존재한다면
        if (existsEmail) {
            return res.status(400).render("edit-profile", {
                pageTitle: "Edit Profile",
                // 에러 메세지 주기
                errorMessage: "Email already taken",
            })
        }
    }
    const isHeroku = process.env.NODE_ENV === "production";

    const updatedUser = await User.findByIdAndUpdate(_id, {
        // user 가 avatar 를 업데이트 하지 않는 경우
        avatarUrl: file ? (isHeroku? file.location : file.path) : avatarUrl,
        name,
        email,
        username,
        location,
    }, 
    {new: true},
    );

    const exists = await User.exists({$or: [{username}, {email}]});


    // 세션을 업데이트 해준다.
    req.session.user = updatedUser;
    return res.redirect("/users/edit")
}

export const remove = (req, res) => res.send("remove User");
export const logout = (req, res) => {
    // req.flash("info", "Bye");
    req.session.destroy();
    return res.redirect("/");
};

export const getChangePassword = (req, res) => {
    // 만약 사용자가 깃헙으로 가입해서 비번이 없다면,
    if (req.session.user.socialOnly === true) {
        req.flash("error", "Can't change password");
        return res.redirect("/")
    }
    return res.render("users/change-password", {pageTitle: "Change Password"});
}
export const postChangePassword = async (req, res) => {
    
    const {
        session: {
            user: {_id, password},
        },
        body: {oldPassword,
            newPassword,
            newPasswordConfirmation},
    } = req;
    // 이전 비번을 기억하는지 확인
    const user = await User.findById(_id);
    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) {
        return res.status(400).render("users/change-password", {
            pageTitle: "Change Password",
            errorMessage: "The current password is incorrect",
        });
    }
    // 새로 만든 비번 정확히 입력했는지 더블체킹. 
    if (newPassword !== newPasswordConfirmation) {
        return res.status(400).render("users/change-password", {
            pageTitle: "Change Password",
            errorMessage: "The password does not match the confirmation",
        });
    }
    
    user.password = newPassword;
    await user.save();
    // send notification
    req.flash("info", "Password Updated");
    return res.redirect("/users/logout");
}

export const see = async (req, res) => {
    const {id} = req.params;
    const user = await User.findById(id).populate({
        path: "videos",
        populate: {
            path: "owner",
            model: "User",
        }
    });
    if (!user) {
        return res.status(404).render("404", {pageTitle: "Page Not Found"});
    }
    return res.render("users/profile", {pageTitle: user.name, user});
};

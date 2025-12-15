/**
 * Surfly Client-side Authentication System
 * Uses localStorage to simulate a database and session.
 */

// User Database Management
const Auth = {
    getUsers: () => {
        const users = localStorage.getItem('surfly_users');
        return users ? JSON.parse(users) : [];
    },

    // Register a new user
    signup: (user) => {
        const users = Auth.getUsers();
        // Check if ID exists
        if (users.find(u => u.username === user.username)) {
            return { success: false, message: "이미 존재하는 아이디입니다." };
        }
        users.push(user);
        localStorage.setItem('surfly_users', JSON.stringify(users));
        return { success: true, message: "회원가입이 완료되었습니다." };
    },

    // Login
    login: (username, password) => {
        const users = Auth.getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            // Save session
            const session = {
                username: user.username,
                nickname: user.nickname,
                loginTime: new Date().getTime()
            };
            localStorage.setItem('surfly_session', JSON.stringify(session));
            return { success: true, message: "로그인 성공!" };
        } else {
            return { success: false, message: "아이디 또는 비밀번호가 일치하지 않습니다." };
        }
    },

    // Logout
    logout: () => {
        localStorage.removeItem('surfly_session');
        alert("로그아웃 되었습니다.");
        window.location.reload();
    },

    // Get current logged-in user
    getCurrentUser: () => {
        const session = localStorage.getItem('surfly_session');
        return session ? JSON.parse(session) : null;
    }
};

// UI Update Logic (Runs on every page load)
document.addEventListener('DOMContentLoaded', () => {
    const user = Auth.getCurrentUser();

    // Update Header Navigation
    const navUl = document.querySelector('.title-banner__nav ul');
    if (navUl) {
        if (user) {
            // Logged In State
            // Replace "Login" with "Logout" or "Profile"
            // Finding the Login link (2nd item usually)

            // Cleanest way: Rebuild the necessary part or find by text
            const links = navUl.querySelectorAll('a');
            links.forEach(link => {
                if (link.textContent.trim() === '로그인') {
                    link.textContent = '로그아웃';
                    link.href = '#';
                    link.onclick = (e) => {
                        e.preventDefault();
                        Auth.logout();
                    };
                }
                // Optional: Change 'Signup' link if exists, or append welcome msg
            });

            // Append Welcome Message if space permits
            // const welcomeLi = document.createElement('li');
            // welcomeLi.innerHTML = `<span style="font-size:0.9rem;">반가워요, <strong>${user.nickname}</strong>님!</span>`;
            // navUl.insertBefore(welcomeLi, navUl.firstChild);
        }
    }

    // Login Page Logic
    const loginForm = document.querySelector('form[action="login_process.html"]');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            const result = Auth.login(username, password);
            if (result.success) {
                // alert(result.message);
                window.location.href = 'index.html'; // Redirect to home
            } else {
                alert(result.message);
            }
        });
    }

    // Signup Page Logic
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Password match check is already handled by inline script, but let's be safe
            const pw = document.getElementById('password').value;
            const confirmPw = document.getElementById('confirmPassword').value;
            if (pw !== confirmPw) {
                alert("비밀번호가 일치하지 않습니다.");
                return;
            }

            const newUser = {
                nickname: signupForm.nickname.value,
                username: signupForm.username.value,
                password: pw,
                email: signupForm.email.value
            };

            const result = Auth.signup(newUser);
            if (result.success) {
                alert(result.message);
                window.location.href = 'login.html';
            } else {
                alert(result.message);
            }
        });
    }
});

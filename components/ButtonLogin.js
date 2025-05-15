import Link from "next/link";

const ButtonLogin = ({ isLoggedIn, name, extraStyle}) => {
    if (isLoggedIn) {
        return (<Link href="/dashboard"className={`btn btn-primary no-underline ${extraStyle ? extraStyle : ""}`}>Welcome back {name}</Link>
        );
    }   
    
    return <button>Login</button>;
}

export default ButtonLogin;
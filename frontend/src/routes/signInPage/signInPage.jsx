import "./signInPage.css";
/* eslint-disable no-unused-vars */
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useForm } from "react-hook-form";
import { toast, ToastContainer } from "react-toastify";
import app from "../../firebase/firebase.config";
import { AuthContext } from "../../Providers/AuthProvider";

const auth = getAuth(app);

const SignInPage = () => {
   const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm();

  const { signIn, signInWithGoogle } = useContext(AuthContext);
  const [loginError, setLoginError] = useState("");
  // const [email, setEmail] = useState("");
  // const [loginUserEmail, setLoginUserEmail] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleLogin = (data) => {
    // data.preventDefault();
    setLoginError("");
    signIn(data.email, data.password)
      .then((result) => {
        const user = result.user;
        //console.log(user);
        toast.success("Login Successfully.", {
          position: toast.POSITION.TOP_CENTER,
        });
        navigate(from, { replace: true });
      })
      .catch((error) => {
        //console.log(error.message);
        setLoginError(error.message);
      });
    reset();
  };

  //gogoole sign in
  const handleGoogleSignIn = () => {
    signInWithGoogle().then((result) => {
      const loggedInUser = result.user;
      const saveUser = {
        name: loggedInUser.displayName,
        email: loggedInUser.email,
        uid: loggedInUser.uid,
      };
      fetch("https://api.gmfaruk.com/users", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(saveUser),
      })
        .then((res) => res.json())
        .then(() => {
          navigate(from, { replace: true });
        });
    });
  };

  // const handleEmailChange = (event) => {
  //   const email = event.target.value;
  //   setEmail(email);
  //   //console.log(email);
  // };
  // const handleForgetPassword = () => {
  //   // setLoginError('');
  //   if (!email) {
  //     toast.error("Please enter your email address.", {
  //       position: toast.POSITION.TOP_CENTER,
  //     });
  //     return;
  //   }
  //   sendPasswordResetEmail(auth, email)
  //     .then(() => {
  //       toast.success("Password reset email sent. Please check your email.", {
  //         position: toast.POSITION.TOP_CENTER,
  //       });
  //     })
  //     .catch((error) => {
  //       //console.error(error);
  //       // setLoginError(error.message);
  //     });
  // };
  return (
    <div className="flex justify-center items-center min-h-screen px-4 bg-gray-100">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h3 className="text-3xl font-bold text-blue-600">Login</h3>
        </div>

        <div className="bg-white shadow-md rounded-xl p-8">
          <form onSubmit={handleSubmit(handleLogin)}>
            {/* Email Field */}
            <div className="mb-4">
              <input
                {...register("email", {
                  required: "Email is required",
                })}
                name="email"
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <input
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be 6 characters or longer",
                  },
                })}
                name="password"
                type="password"
                placeholder="Password"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Forget Password */}
            <div className="mb-4 text-right">
              <button
                type="button"
                className="text-sm text-blue-500 hover:underline"
              >
                Forget Password?
              </button>
            </div>

            {/* Error Message */}
            {loginError && (
              <p className="text-sm text-red-600 mb-4">{loginError}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full border border-blue-600 text-blue-600 py-2 rounded-md mt-4 hover:bg-blue-50 transition"
          >
            Sign in with Google
          </button>

          {/* Register Link */}
          <div className="text-center mt-4 text-sm">
            New user?{" "}
            <Link
              to="/register"
              className="text-blue-600 hover:underline font-medium"
            >
              Register Here
            </Link>
          </div>
        </div>

        <ToastContainer />
      </div>
    </div>
  );
};

export default SignInPage;

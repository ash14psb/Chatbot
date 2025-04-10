import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { toast, ToastContainer } from "react-toastify";
import "./signUpPage.css";
import { AuthContext } from "../../Providers/AuthProvider";


const SignUpPage = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const { createUser, updateUserProfile, signInWithGoogle, verifyEmail } =
    useContext(AuthContext);

  const [signUpError, setSignUPError] = useState("");
  console.log(signUpError);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  //register user with email
  const handleSignUp = (data) => {
    //console.log(data);
    setSignUPError("");
    createUser(data.email, data.password)
      .then((result) => {
        const loggedUser = result.user;
        //console.log(loggedUser);

        updateUserProfile(data.name, loggedUser.photoURL, loggedUser.uid).then(
          () => {
            const saveUser = {
              name: data.name,
              email: loggedUser.email,
              uid: loggedUser.uid,
            };
            fetch("http://localhost:5000/users", {
              method: "POST",
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify(saveUser),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.insertedId) {
                  reset();
                  toast.success("User Created Successfully.", {
                    position: toast.POSITION.TOP_CENTER,
                  });
                  navigate("/");
                }
              });
          }
        );
        //.catch((error) => //console.log(error));

        verifyEmail();
      })
      .catch((error) => {
        //console.log(error);
        setSignUPError(error.message);
      });
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
      fetch("users", {
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

  return (
    <div className="container mx-auto">
      <div className="flex justify-center items-center">
        <div className="bg-white w-96">
          <div className="">
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-gray-800">Sign Up</h3>
            </div>
            <div className="bg-white shadow-md rounded-lg p-8">
              <form onSubmit={handleSubmit(handleSignUp)}>
                <div className="mb-4">
                  <input
                    {...register("name", {
                      required: "Name is required",
                    })}
                    name="name"
                    type="text"
                    placeholder="Enter Name"
                    className="w-full px-4 py-2 text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <input
                    {...register("email", {
                      required: "Email is required",
                    })}
                    name="email"
                    type="email"
                    placeholder="Enter Email"
                    className="w-full px-4 py-2 text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <input
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be 6 characters long",
                      },
                      pattern: {
                        value: /(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])/,
                        message:
                          "Password must have uppercase, number and special characters",
                      },
                    })}
                    name="password"
                    type="password"
                    placeholder="Password"
                    className="w-full px-4 py-2 text-gray-800 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <p className="text-red-500 text-sm mb-4">
                  {/* {signUpError} */}
                </p>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  Register
                </button>
              </form>

              <button
                onClick={handleGoogleSignIn}
                className="w-full border  border-blue-600 text-blue-600 py-2 rounded mt-4 hover:bg-blue-50 transition"
              >
                Sign in with Google
              </button>

              <div className="mt-4 text-center">
                <p className="text-gray-800">
                  Already have an account?{" "}
                  <Link to="/sign-in" className="text-blue-600  hover:underline">
                    Login
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer autoClose={false} />
    </div>
  );
};

export default SignUpPage;

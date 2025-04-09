import { createContext, useEffect, useState } from "react";
import PropTypes from "prop-types";

import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

import app from "../firebase/firebase.config";
import { toast } from "react-toastify";
import axios from "axios";



export const AuthContext = createContext(null);
const auth = getAuth(app);
//console.log(auth);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const googleProvider = new GoogleAuthProvider();

  const createUser = (email, password) => {
    setLoading(true);
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signIn = (email, password) => {
    setLoading(true);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = () => {
    setLoading(true);
    return signInWithPopup(auth, googleProvider);
  };
  const verifyEmail = () => {
    setLoading(true);
    sendEmailVerification(auth.currentUser).then(() => {
      toast.success("Please check your email to verify.", {
        position: toast.POSITION.TOP_CENTER,
      });
    });
  };

  const logOut = () => {
    setLoading(true);
    return signOut(auth);
  };

  const updateUserProfile = (name, email, uid) => {
    return updateProfile(auth.currentUser, {
      displayName: name,
      email: email,
      uid: uid,
    });
  };

  const deleteUser = () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    //console.log(currentUser, "currentUser");
    if (currentUser) {
      currentUser
        .delete()
        .then(() => {
          toast.success("User deleted successfully.", {
            position: toast.POSITION.TOP_CENTER,
          });
          setLoading(false);
        })
        .catch(() => {
          toast.error("Error deleting user.", {
            position: toast.POSITION.TOP_CENTER,
          });
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      //console.log("current user", currentUser);

      // get and set token
      if (currentUser) {
        axios
          .post("http://localhost:5000/jwt", {
            email: currentUser.email,
          })
          .then((data) => {
            localStorage.setItem("access-token", data.data.token);
            setLoading(false);
          });
      } else {
        localStorage.removeItem("access-token");
      }
    });
    return () => {
      return unsubscribe();
    };
  }, []);

  const authInfo = {
    createUser,
    signIn,
    signInWithGoogle,
    updateUserProfile,
    logOut,
    user,
    loading,
    verifyEmail,
    deleteUser,
  };

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
export default AuthProvider;

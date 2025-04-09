import { IKContext, IKUpload } from "imagekitio-react";
import { useRef } from "react";

// Ensure the ImageKit URL and public key are correctly set in your environment variables
const urlEndpoint = import.meta.env.VITE_IMAGE_KIT_ENDPOINT;
const publicKey = import.meta.env.VITE_IMAGE_KIT_PUBLIC_KEY;

// Authenticator function to get the signature and token from your server
const authenticator = async () => {
  try {
    // Fetch the authentication details from your server with POST
    const response = await fetch("http://localhost:5000/api/upload", {
      method: "POST", // Change the method to POST
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Request failed with status ${response.status}: ${errorText}`
      );
    }

    // Assuming your server responds with signature, expire, and token
    const data = await response.json();
    const { signature, expire, token } = data;
    return { signature, expire, token };
  } catch (error) {
    // Log and throw the error to be handled
    console.log("Authentication Error: ", error);
    throw new Error(`Authentication request failed: ${error.message}`);
  }
};

const Upload = ({ setImg }) => {
  const ikUploadRef = useRef(null);

  // Handle upload errors
  const onError = (err) => {
    console.log("Upload Error", err);
    alert("An error occurred during the upload. Please try again.");
  };

  // Handle successful upload response
  const onSuccess = (res) => {
    console.log("Upload Success", res);
    // Set the uploaded file data in the state
    setImg((prev) => ({ ...prev, isLoading: false, dbData: res }));
  };

  // Handle upload progress
  const onUploadProgress = (progress) => {
    console.log("Upload Progress", progress);
  };

  // Handle file upload start
  const onUploadStart = (evt) => {
    const file = evt.target.files[0];

    // Check file type before starting upload
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      // Set the AI image data (optional, based on your logic)
      setImg((prev) => ({
        ...prev,
        isLoading: true,
        aiData: {
          inlineData: {
            data: reader.result.split(",")[1],
            mimeType: file.type,
          },
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <IKContext
      urlEndpoint={urlEndpoint}
      publicKey={publicKey}
      authenticator={authenticator}
    >
      <IKUpload
        fileName="test-upload.png" // Optional: specify file name
        onError={onError} // Handle error
        onSuccess={onSuccess} // Handle success
        onUploadProgress={onUploadProgress} // Track progress
        onUploadStart={onUploadStart} // Handle start of upload
        useUniqueFileName={true} // Ensure unique file name
        style={{ display: "none" }} // Hide the default button
        ref={ikUploadRef} // Reference to trigger the file input
      />
      <label
        className="upload-button"
        onClick={() => ikUploadRef.current.click()}
      >
        <img src="/attachment.png" alt="Upload" className="upload-icon" />
      </label>
    </IKContext>
  );
};

export default Upload;

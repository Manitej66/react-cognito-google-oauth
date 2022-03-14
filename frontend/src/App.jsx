import { Auth } from "aws-amplify";
import React, { useState, useEffect } from "react";

const App = () => {
  const [user, setUser] = useState(null);
  console.log(user);
  const [loading, setLoading] = useState(true);

  const getUser = async () => {
    const user = await Auth.currentUserInfo();
    if (user) setUser(user);
    setLoading(false);
  };

  const signIn = async () =>
    await Auth.federatedSignIn({
      provider: "Google",
    });

  const signOut = async () => await Auth.signOut();

  useEffect(() => {
    getUser();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {user ? (
        <div>
          <p>{user.attributes.name}</p>
          <p>{user.attributes.email}</p>
          <img
            width={100}
            src={user.attributes.picture.replace("=s96-c", "", true)}
            alt="Profile"
          />{" "}
          <br />
          <button onClick={signOut}>logout</button>
        </div>
      ) : (
        <div>
          <p>Not signed in</p>
          <button onClick={signIn}>login</button>
        </div>
      )}
    </div>
  );
};

export default App;

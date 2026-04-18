import { useEffect, useState } from "react";
import { getToken, logout } from "../utils/auth";
import { getMe, apiRequest } from "../utils/api";

export default function Profile(){
    return(
        <div>
            <h2>Jane Doe's profile.</h2>
            <p>Here is a description of the stuff that jane Doe likes to read.</p>
        </div>
    );
}
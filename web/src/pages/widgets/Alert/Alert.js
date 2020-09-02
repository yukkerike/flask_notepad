import React from "react"
import './Alert.css'
export default (props) =>
    <div className="alert alert-danger">
        {props.text}
    </div>


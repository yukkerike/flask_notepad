import React from "react"
import './NotesList.css'
import Api from '../../../js/api'
const months = ['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июня', 'июля', 'сен.', 'окт.', 'ноя.', 'дек.']

class NotesList extends React.Component{
    constructor(props) {
        super(props)
        this.notes = props.state.notes
        this.setter = props.setter
    }
    remove_note = async (id)=>{
        await Api.api("remove_note", {note_id: id})
        this.setter({notes:this.notes.filter((note)=>note[0]!==id)})
    }
    format_date(timestamp){
        let day = new Date(timestamp*1000)
        let r = day.getHours() + ':' + `0${day.getMinutes()}`.slice(-2) + ' ' + day.getDate() + ' ' + months[day.getMonth()-1] + ' ' + day.getFullYear()
        return r
    }
    render() {
        return(
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4">
                {this.notes.map((note)=>{
                    return(
                        <div key={note[0]} className="col" style={{marginBottom:10}}>
                            <div className="card bg-light" onClick={()=>{window.location.href = '/#/home/note/'+note[0]}}>
                                <div className="card-header navbar">
                                    <span>{note[1]}</span>
                                    <button className="btn btn-danger" style={{width: 38,height: 38,color: 'white'}} onClick={(e)=>{e.stopPropagation();this.remove_note(note[0])}}>
                                        –
                                    </button>
                                </div>
                                <div className="card-body">
                                    <pre className="card-text">
                                        {note[2]}
                                    </pre>
                                </div>
                                <hr />
                                <span id={"timestamp"}>Изменено: {this.format_date(note[3])}</span>
                            </div>
                        </div>)
                })}
            </div>
        )
    }
}
export default NotesList

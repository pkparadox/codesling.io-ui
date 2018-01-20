import React, { Component } from 'react';
import CodeMirror from 'react-codemirror2';
import io from 'socket.io-client/dist/socket.io.js';
import axios from 'axios';
import { throttle } from 'lodash';
import { Link } from 'react-router-dom';

import Stdout from './StdOut/index.jsx';
import EditorHeader from './EditorHeader';
import Button from '../globals/Button';

import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/base16-dark.css';
import './Sling.css';

class Sling extends Component {
  constructor() {
    super();
    this.state = {
      id: null,
      username: null,
      ownerText: null,
      challengerText: null,
      text: '',
      challenge: '',
      stdout: '',
      message: null,
      roomname: window.location.href.split('/')[3],
      messages: []
    }
    this.handleUserMessage = this.handleUserMessage.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
    this.goHome = this.goHome.bind(this);
  }

  componentDidMount() {
    const { socket, challenge } = this.props;
    const startChall = typeof challenge === 'string' ? JSON.parse(challenge) : {}
    socket.on('connect', () => {
      socket.emit('client.ready', startChall);
    });

    socket.on('server.initialState', ({ id, username, text, challenge }) => {
      this.setState({
        id,
        username,
        ownerText: text,
        challengerText: text,
        challenge
      });
    });

    socket.on('server.changed', ({ text, email }) => {
      if (localStorage.getItem('email') === email) {
        this.setState({ ownerText: text });
      } else {
        this.setState({ challengerText: text });
      }
    });

    socket.on('server.run', ({ stdout, email }) => {
      const ownerEmail = localStorage.getItem('email');
      email === ownerEmail ? this.setState({ stdout }) : null;
    });
    socket.on('server.message', (message) => {
      axios.get('http://52.53.213.77:3396/api/messages/getMessages')
        .then((res) => {
          let newData = res.data.filter(message => {
            return message.roomname === this.state.roomname
          })
          this.setState({
            messages: newData
          })
        })
        .catch(() => {
          console.log('error in client get messages');
        })
    })
    window.addEventListener('resize', this.setEditorSize);
    var webrtc = new SimpleWebRTC({
      // the id/element dom element that will hold "our" video
      localVideoEl: 'localVideo',
      // the id/element dom element that will hold remote videos
      remoteVideosEl: 'remotesVideos',
      // immediately ask for camera access
      autoRequestMedia: true
    });
    webrtc.on('readyToCall', function () {
      // you can name it anything
      webrtc.joinRoom('your awesome room name');
    });
  }
  goHome = async () => {
    const result = await axios({
      method: 'DELETE', 
      url: 'http://52.53.213.77:3396/api/messages/deleteMessages', 
      data: { 
        roomname: this.state.roomname 
      }})
      // .then((res) => {
      //   console.log(res);
      // })
      // .catch(() => {
      //   console.error('error deleting');
      // })
  }
  submitCode = () => {
    const { socket } = this.props;
    const { ownerText } = this.state;
    const email = localStorage.getItem('email');
    socket.emit('client.run', { text: ownerText, email });
  }

  handleChange = throttle((editor, metadata, value) => {
    const email = localStorage.getItem('email');
    this.props.socket.emit('client.update', { text: value, email });
  }, 250)

  setEditorSize = throttle(() => {
    this.editor.setSize(null, `${window.innerHeight - 80}px`);
  }, 100);

  initializeEditor = (editor) => {
    this.editor = editor;
    this.setEditorSize();
  }
  handleUserMessage = async (e) => {
    const { socket } = this.props;
    e.preventDefault();
    this.setState({
      [e.target.name]: e.target.value
    })
    if (this.state.message === null) {
      return;
    }
    const payload = {
      username: localStorage.username,
      message: this.state.message,
      roomname: this.state.roomname
    }
    try {
      const data = await axios.post('http://52.53.213.77:3396/api/messages/addMessage', payload)
      data ? socket.emit('client.message', (this.state.message)) : console.log('error retrieving data');
    } catch (err) {
      throw new Error(err);
    }
      // .then((res) => {
      //   console.log(res.data);
      //   socket.emit('client.message', (this.state.message))

      // })
      // .catch(() => {
      //   console.log('error in addMessage');
      // })
    document.getElementById("trashInput").value = '';
    this.setState({
      message: null
    })
  }
  handleMessageChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  render() {
    const trash = 'Talk trash:';
    const { socket } = this.props;
    return (
      <div className="sling-container">
        <EditorHeader />
        <div className="code1-editor-container">
          <CodeMirror
            editorDidMount={this.initializeEditor}
            value={this.state.ownerText}
            options={{
              mode: 'javascript',
              lineNumbers: true,
              theme: 'base16-dark',
            }}
            onChange={this.handleChange}
          />
          <form className="trash" onSubmit={this.handleUserMessage} autoComplete="off">
            {trash}<br />
            <input id="trashInput" className="trashMessage" type="text" name="message" onChange={this.handleMessageChange}></input>
          </form>
          <video width="100%" id="localVideo"></video>
        </div>
        <div className="stdout-container">
          {this.state.challenge.title || this.props.challenge.title}
          <br />
          {this.state.challenge.content || this.props.challenge.content}
          <Stdout text={this.state.stdout} />
          <Button
            className="run-btn"
            text="Run Code"
            backgroundColor="red"
            color="white"
            onClick={() => this.submitCode()}
          />
          <Button
            className="run-btn"
            text="Go Home"
            backgroundColor="red"
            color="white"
            onClick={() => this.goHome()}
          />
          <div className="messages">
            <ul>
            {this.state.messages.map((message, i) => (
              <div key={i}>
                <li className="liMessage">{message.username}: {message.message}</li>
              </div>
            ))}
            </ul>
          </div>
        </div>
        <div className="code2-editor-container">
          <CodeMirror
            editorDidMount={this.initializeEditor}
            value={this.state.challengerText}
            options={{
              mode: 'javascript',
              lineNumbers: true,
              theme: 'base16-dark',
              readOnly: true,
            }}
          />
          <div id="remotesVideos"></div>
        </div>
      </div>
    )
  }
}

export default Sling;

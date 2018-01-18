import React, { Component } from 'react';
import CodeMirror from 'react-codemirror2';
import io from 'socket.io-client/dist/socket.io.js';
import axios from 'axios';
import { throttle } from 'lodash';

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
      message: '',
      messages: []
    }
    this.handleUserMessage = this.handleUserMessage.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
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
      axios.get('http://localhost:3396/api/messages/getMessages')
        .then((res) => {
          console.log('res in client get', res.data);
          this.setState({
            messages: res.data
          })
          console.log(this.state.messages);
        })
        .catch(() => {
          console.log('error in client get messages');
        })
    })

    window.addEventListener('resize', this.setEditorSize);
    (function () {
      var video1 = document.getElementById('video1'),
        video2 = document.getElementById('video2'),
        vendorUrl = window.URL || window.webkitURL;

      navigator.getMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
      navigator.getMedia({
        video: true,
        audio: false
      }, function (stream) {
        video1.src = vendorUrl.createObjectURL(stream);
        video1.play();
      }, function (error) {
        console.log(error);
      })
    })();
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
  handleUserMessage(e) {
    const { socket } = this.props;
    e.preventDefault();
    this.setState({
      [e.target.name]: e.target.value
    })
    const payload = {
      message: this.state.message
    }
    axios.post('http://localhost:3396/api/messages/addMessage', payload)
      .then((res) => {
        console.log(res.data);
        socket.emit('client.message', (this.state.message))

      })
      .catch(() => {
        console.log('error in addMessage');
      })
    document.getElementById("trashInput").value = '';
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
          <form className="trash" onSubmit={this.handleUserMessage}>
            {trash}<br />
            <input id="trashInput" className="trashMessage" type="text" name="message" onChange={this.handleMessageChange}></input>
          </form>
          <video id="video1" width="348" height="300"></video>
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
          <div className="messages">
            <ul>
            {this.state.messages.map((message, i) => (
              <div key={i}>
                <li className="liMessage">{message.id}: {message.message}</li>
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
        </div>
      </div>
    )
  }
}

export default Sling;

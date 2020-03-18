import React, {Component} from "react";
import {Button, Col, Container, Form, Row} from "react-bootstrap";
import "./Login.scss";
import {AuthProviderButton} from "../../../core/components/AuthProviderButton";
import Help from '../../../core/components/Help/Help';
import Sidebar from "../../../core/components/Sidebar";
import UserService from "../../../core/services/PocketUserService";


class Login extends Component {

  constructor(props, context) {
    super(props, context);

    this.state = {
      authProviders: []
    };
  }

  componentDidMount() {
    /** @type {UserService} */
    UserService.getAuthProviders().then(providers => {
      this.setState({authProviders: providers});
    });
  }

  /**
   * @param {string} name Name of auth provider.
   *
   * @return {{name: string, consent_url:string}}
   * @private
   */
  __getAuthProvider(name) {
    /** @type {Array.<{name:string, consent_url:string}>} */
    const authProviders = this.state.authProviders;

    return authProviders.filter(value => value.name.toLowerCase() === name.toLowerCase())[0];
  }

  render() {
    return (
      <Container fluid id={"login-page"}>
        <Row>
          <Sidebar/>
          <Col id={"content"}>
            <Help/>

            <div id={"main"}>
              <h1>Login</h1>
              <div id={"provider-buttons"}>
                <AuthProviderButton authProvider={this.__getAuthProvider("google")}/>
                <AuthProviderButton authProvider={this.__getAuthProvider("github")}/>
              </div>
              <hr/>
              <Form id={"main-form"}>
                <Form.Group>
                  <Form.Label>E-mail</Form.Label>
                  <Form.Control type="email"/>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="password"/>
                </Form.Group>
                <p>Forgot your password? <a href="#">click here</a></p>

                <Button type="submit" variant="dark" size={"lg"} block>Login</Button>
                <div>
                  {/* eslint-disable-next-line */}
                  <a href="#">You don't have an account?</a>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default Login;

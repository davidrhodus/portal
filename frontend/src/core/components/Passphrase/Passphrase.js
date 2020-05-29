import React, {Component} from "react";
import "./Passphrase.scss";
import {Col, Form, Row, Button} from "react-bootstrap";
import AppAlert from "../../../core/components/AppAlert";
import AppTable from "../../../core/components/AppTable";
import InfoCard from "../../../core/components/InfoCard/InfoCard";
import {TABLE_COLUMNS, VALIDATION_MESSAGES, PASSPHRASE_REGEX} from "../../../_constants";
import {Formik} from "formik";
import * as yup from "yup";
import {createAndDownloadJSONFile, validateYup} from "../../../_helpers";
import Segment from "../../../core/components/Segment/Segment";
import LoadingButton from "../../../core/components/LoadingButton";

class Passphrase extends Component {
  constructor(props, context) {
    super(props, context);

    this.changeInputType = this.changeInputType.bind(this);
    this.handlePassphrase = this.handlePassphrase.bind(this);
    this.createAccount = this.createAccount.bind(this);
    this.downloadKeyFile = this.downloadKeyFile.bind(this);

    this.iconUrl = {
      open: "/assets/open_eye.svg",
      close: "/assets/closed_eye.svg",
    };

    this.schema = yup.object().shape({
      passPhrase: yup
        .string()
        .required(VALIDATION_MESSAGES.REQUIRED)
        .matches(PASSPHRASE_REGEX, "The password does not meet the requirements"
        ),
    });

    this.state = {
      type: "",
      fileName: "",
      created: false,
      fileDownloaded: false,
      inputType: "password",
      validPassphrase: false,
      showPassphraseIconURL: this.iconUrl.open,
      privateKey: "",
      address: "",
      chains: [],
      error: {show: false, message: ""},
      data: {
        passPhrase: "",
      },
      redirectPath: "",
      redirectParams: {},
      loading: false,
    };
  }

  changeInputType() {
    const {inputType} = this.state;

    if (inputType === "text") {
      this.setState({
        inputType: "password",
        showPassphraseIconURL: this.iconUrl.open,
      });
    } else {
      this.setState({
        inputType: "text",
        showPassphraseIconURL: this.iconUrl.close,
      });
    }
  }

  async handlePassphrase(values) {
    const valid = await validateYup(values, this.schema);

    if (valid === undefined) {
      this.setState({
        passPhrase: values.passPhrase,
        validPassphrase: true,
      });
    } else {
      this.setState({validPassphrase: false});
    }
  }

  /**
   * Handles account creation and next steps
   * @abstract
   */
  async createAccount() {}

  downloadKeyFile() {
    const {privateKey, passPhrase, fileName} = this.state;
    const data = {private_key: privateKey, passphrase: passPhrase};

    createAndDownloadJSONFile(fileName, data);

    this.setState({
      fileDownloaded: true,
    });
  }

  render() {
    const {
      created,
      fileDownloaded,
      inputType,
      showPassphraseIconURL,
      validPassphrase,
      privateKey,
      address,
      redirectPath,
      error,
      loading,
      type,
    } = this.state;

    const generalInfo = [
      {title: "0 POKT", subtitle: "Staked tokens"},
      {title: "0 POKT", subtitle: "Balance"},
      {title: "_ _", subtitle: "Stake status"},
      {title: "_ _", subtitle: "Max Relay Per Day"},
    ];

    return (
      <div id="passphrase">
        <Row>
          <Col className="page-title">
            {error.show && (
              <AppAlert
                variant="danger"
                title={error.message}
                dismissible
                onClose={() => this.setState({error: {show: false}})}
              />
            )}
            <h1>Create {type}</h1>
          </Col>
        </Row>
        <Row>
          <Col className="page-title">
            <h2>Protect your private key with a passphrase</h2>
            <p>
              Write down a passphrase to protect your key file. This should have
              minimum 15 alphanumeric symbols, one capital letter, one
              lowercase, one special character and one number.
            </p>
            <Formik
              validationSchema={this.schema}
              onSubmit={(data) => {
                this.setState({data});
              }}
              initialValues={this.state.data}
              values={this.state.data}
              validateOnChange={true}
              validateOnBlur={false}
              validate={this.handlePassphrase}
            >
              {({handleSubmit, handleChange, values, errors}) => (
                <Form
                  noValidate
                  onSubmit={handleSubmit}
                  className="create-passphrase-form"
                >
                  <Form.Row>
                    <Col className="show-passphrase">
                      <Form.Group>
                        <Form.Control
                          placeholder="*****************"
                          value={values.passPhrase}
                          type={inputType}
                          name="passPhrase"
                          onChange={(data) => {
                            handleChange(data);
                          }}
                          isInvalid={!!errors.passPhrase}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.passPhrase}
                        </Form.Control.Feedback>
                      </Form.Group>
                      <img
                        onClick={this.changeInputType}
                        src={showPassphraseIconURL}
                        alt=""
                      />
                    </Col>
                    <Col>
                      <LoadingButton
                        loading={loading}
                        buttonProps={{
                          disabled: !validPassphrase,
                          className: `pl-4 pr-4 pt-2 pb-2 ${
                            created ? "download-key-file-button" : null
                          }`,
                          variant: !created ? "primary" : "dark",
                          type: "submit",
                          onClick: !created
                            ? () => this.createAccount()
                            : () => this.downloadKeyFile(),
                        }}
                      >
                        <span>
                          {created ? (
                            <img
                              src={"/assets/download.svg"}
                              alt="download-key-file"
                              className="download-key-file-icon"
                            />
                          ) : null}
                          {created ? "Download key file" : "Create"}
                        </span>
                      </LoadingButton>
                    </Col>
                  </Form.Row>
                </Form>
              )}
            </Formik>
          </Col>
        </Row>
        <Row className="mt-4">
          <Col sm="6" md="6" lg="6">
            <h3>Private key</h3>
            <Form.Control readOnly value={privateKey} />
          </Col>
          <Col sm="6" md="6" lg="6">
            <h3>Address</h3>
            <Form.Control readOnly value={address} />
          </Col>
        </Row>
        <Row className="mt-5">
          <Col>
            <AppAlert
              className="pb-4 pt-4"
              variant="warning"
              title={
                <>
                  <h4 className="text-uppercase">
                    Don&#39;t forget to save your passphrase!{" "}
                  </h4>
                  <p className="ml-1">
                    Make a backup, store it and save preferably offline.
                  </p>
                </>
              }
            >
              <p>
                The key file by itself is useless without the passphrase and
                you&#39;ll need it to import or set up your application.
              </p>
            </AppAlert>
          </Col>
        </Row>
        <Row>
          <Col className="page-title">
            <h1>General information</h1>
          </Col>
        </Row>
        <br />
        <Row className="stats">
          {generalInfo.map((card, idx) => (
            <Col key={idx}>
              <InfoCard title={card.title} subtitle={card.subtitle} />
            </Col>
          ))}
        </Row>
        <br />
        <Row className="mb-5 networks">
          <Col>
            <Segment label="Networks">
              <AppTable
                scroll
                keyField="hash"
                data={[]}
                columns={TABLE_COLUMNS.NETWORK_CHAINS}
                bordered={false}
              />
            </Segment>
          </Col>
        </Row>
        <Row>
          <Col>
            <Button
              disabled={!fileDownloaded}
              onClick={() =>
                // eslint-disable-next-line react/prop-types
                this.props.history.replace(redirectPath)
              }
            >
              <span>Continue</span>
            </Button>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Passphrase;

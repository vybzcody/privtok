import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Typography,
  Upload as AntdUpload,
  Alert,
  Progress,
  Steps,
  Space,
  Row,
  Col,
  Select,
  Divider,
} from "antd";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { usePrivTokState } from "../components/PrivTokState.jsx";
import {
  createTransaction,
  waitTransactionConfirmation,
} from "../core/transaction.js";
import { encodeStringAsField, stringToFieldInputs } from "../core/encoder.js";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Upload as UploadIcon,
  FileText,
  Lock,
  CheckCircle,
  Loader2,
  Video,
  Music,
  Image as ImageIcon,
  File as FileIcon,
  ArrowRight,
  Shield,
  DollarSign,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { storacha } from "../services/storacha.js";
import { AleoEncryption } from "../services/aleoEncryption.js";
import { QuadrantSelector } from "../components/content/ContentBadge.jsx";
import { getQuadrant } from "../utils/contentMatrix.js";

const { Title, Text } = Typography;
const { Dragger } = AntdUpload;
const { Option } = Select;

// Content type detection
const detectContentType = (file) => {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("application/pdf") || file.type.startsWith("text/"))
    return "document";
  return "other";
};

const getContentTypeIcon = (type) => {
  switch (type) {
    case "video":
      return <Video size={24} color="var(--primary)" />;
    case "audio":
      return <Music size={24} color="#3b82f6" />;
    case "image":
      return <ImageIcon size={24} color="#10b981" />;
    case "document":
      return <FileIcon size={24} color="#f59e0b" />;
    default:
      return <FileText size={24} color="#666" />;
  }
};

export const Upload = () => {
  const { executeTransaction, connected, wallet, transactionStatus, signMessage } =
    useWallet();
  const { privTokState, updateState } = usePrivTokState();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // State management
  const [file, setFile] = useState(null);
  const [contentType, setContentType] = useState(null);
  const [uploadStep, setUploadStep] = useState(0); // 0: select, 1: encrypt/upload, 2: pricing, 3: review, 4: success
  const [encryptionStep, setEncryptionStep] = useState(0); // 0: ready to encrypt, 1: encrypting, 2: ready to upload, 3: uploading, 4: done
  const [encryptedBlob, setEncryptedBlob] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ipfsCid, setIpfsCid] = useState(null);
  const [fileNonce, setFileNonce] = useState(null);
  const [aleoTxId, setAleoTxId] = useState(null);
  const [error, setError] = useState(null);
  const [txStatus, setTxStatus] = useState("idle");

  // Pricing and visibility state
  const [quadrantSelection, setQuadrantSelection] = useState({
    isPaid: false,
    isPrivate: false,
  });

  // Auto-trigger upload when entering step 1
  // REMOVED - now using explicit multi-step buttons

  const [price, setPrice] = useState(0);
  const [tokenType, setTokenType] = useState(0);
  const [accessKind, setAccessKind] = useState(0);
  const [title, setTitle] = useState("");

  // Check if user has a creator profile
  const hasProfile = privTokState.hasProfile;
  const isLoading = privTokState.isLoading;

  // Redirect if not connected
  if (!connected) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Lock
            size={64}
            color="var(--primary)"
            style={{ margin: "0 auto 24px" }}
          />
          <Title level={2}>Connect Wallet First</Title>
          <Text
            type="secondary"
            style={{ display: "block", marginBottom: "32px" }}
          >
            Please connect your Aleo wallet to upload content
          </Text>
          <Link to="/">
            <Button type="primary" size="large">
              Go to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Show loader while checking profile
  if (isLoading && !hasProfile) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <Loader2
          size={48}
          className="animate-spin"
          color="var(--primary)"
          style={{ marginBottom: "24px", margin: "0 auto" }}
        />
        <Title level={3}>Verifying Creator Identity</Title>
        <Text type="secondary">
          Checking your profile on the Aleo blockchain...
        </Text>
      </div>
    );
  }

  // Prompt to register if connected but no profile
  if (!hasProfile) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Shield
            size={64}
            color="var(--primary)"
            style={{ margin: "0 auto 24px" }}
          />
          <Title level={2}>Register as a Creator</Title>
          <Text
            type="secondary"
            style={{ display: "block", marginBottom: "32px" }}
          >
            You need to register your creator identity on Aleo before you can
            upload content.
          </Text>
          <Link to="/studio">
            <Button type="primary" size="large">
              Go to Creator Studio
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // File selection handler
  const handleBeforeUpload = (selectedFile) => {
    setFile(selectedFile);
    const type = detectContentType(selectedFile);
    setContentType(type);
    setError(null);
    setUploadStep(1); // Move to encrypt/upload step
    setEncryptionStep(0); // Ready to encrypt
    setEncryptedBlob(null);
    setIpfsCid(null);
    setFileNonce(null);
    return false; // Prevent automatic upload
  };

  // Encrypt file step
  const handleEncrypt = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    const toastId = toast.loading("Preparing encryption...");

    try {
      setUploading(true);
      setError(null);
      setEncryptionStep(1); // Encrypting

      // 1. DERIVE ENCRYPTION SEED
      toast.loading("Deriving encryption keys from your wallet...", {
        id: toastId,
      });
      console.log("[Upload] Starting encryption, requesting signature...");

      const message =
        "Authorize PrivTok to encrypt/decrypt your private content.";
      console.log("[Upload] Calling signMessage...");
      const signature = await signMessage(message);
      console.log("[Upload] Signature received:", signature ? "yes" : "no");

      if (!signature) {
        throw new Error(
          "Signature cancelled. Encryption key could not be derived.",
        );
      }

      // 2. ENCRYPT THE FILE
      toast.loading("Encrypting your file locally...", { id: toastId });
      console.log("[Upload] Encrypting file...");

      const { encryptedBlob, nonce } = await AleoEncryption.encryptFile(
        file,
        signature,
      );
      console.log("[Upload] File encrypted, nonce:", nonce);

      setEncryptedBlob(encryptedBlob);
      setFileNonce(AleoEncryption.nonceToFields(nonce));
      setEncryptionStep(2); // Ready to upload

      toast.success("File encrypted successfully! Ready to upload.", {
        id: toastId,
      });
    } catch (err) {
      console.error("Encryption failed:", err);
      setError(`Encryption failed: ${err.message}`);
      toast.error("Failed to encrypt your content", { id: toastId });
      setEncryptionStep(0); // Reset to try again
    } finally {
      setUploading(false);
    }
  };

  // Upload encrypted file to IPFS
  const handleUpload = async () => {
    if (!encryptedBlob) {
      setError("Please encrypt the file first");
      return;
    }

    const toastId = toast.loading("Uploading to IPFS...");

    try {
      setUploading(true);
      setEncryptionStep(3); // Uploading

      toast.loading("Uploading encrypted file to IPFS...", { id: toastId });
      console.log("[Upload] Uploading to IPFS...");
      const encryptedFile = new File([encryptedBlob], `${file.name}.enc`, {
        type: "application/octet-stream",
      });
      const cid = await storacha.upload(encryptedFile);
      console.log("[Upload] IPFS upload complete, CID:", cid);

      setIpfsCid(cid);
      setEncryptionStep(4); // Done

      toast.success(`Uploaded to IPFS: ${cid.substring(0, 12)}...`, {
        id: toastId,
      });
      setUploadStep(2); // Move to pricing step
    } catch (err) {
      console.error("IPFS upload failed:", err);
      setError(`Upload failed: ${err.message}`);
      toast.error("Failed to upload to IPFS", { id: toastId });
      setEncryptionStep(2); // Back to ready to upload
    } finally {
      setUploading(false);
    }
  };

  // Legacy function - combined encrypt+upload (keep for compatibility)
  const handleUploadToIPFS = async () => {
    await handleEncrypt();
    if (encryptionStep === 2) {
      await handleUpload();
    }
  };

  // Move to review step
  const handleContinueToReview = () => {
    const formData = form.getFieldsValue();
    setTitle(formData.title || "");
    setUploadStep(3);
  };

  // Submit to Aleo blockchain
  const handleSubmitToAleo = async () => {
    if (!ipfsCid || !fileNonce) {
      setError("Please complete the secure upload first");
      return;
    }

    const toastId = toast.loading("Publishing content to Aleo...");

    try {
      setUploading(true);
      setTxStatus("pending");

      // Convert IPFS CID to field array
      const urlFields = stringToFieldInputs(ipfsCid);
      const urlFieldsFormatted = `[${urlFields.join(", ")}]`;
      const nonceFormatted = `[${fileNonce.join(", ")}]`;

      const multiplier = 1_000_000;
      const amount = BigInt(Math.floor(price * multiplier));

      const accessKindValue = quadrantSelection.isPrivate ? "0" : "1"; // 0 = private, 1 = public

      const params = {
        functionName: "create_content_post",
        inputs: [
          amount.toString() + "u128",
          encodeStringAsField(title),
          urlFieldsFormatted,
          nonceFormatted,
          accessKindValue + "field",
          accessKind.toString() + "field",
          tokenType.toString() + "u8",
        ],
        fee: 250000,
        feePrivate: false,
      };

      const txId = await createTransaction(params, executeTransaction);
      setAleoTxId(txId);
      toast.loading("Transaction submitted! Waiting for confirmation...", {
        id: toastId,
      });

      await waitTransactionConfirmation(txId, null, transactionStatus);

      setTxStatus("confirmed");
      setUploadStep(4); // success
      toast.success("Content successfully published to Aleo!", { id: toastId });

      if (updateState) {
        await updateState(true);
      }
    } catch (err) {
      console.error("Aleo submission failed:", err);
      toast.error(`Failed to publish: ${err.message}`, { id: toastId });
      setError(`Aleo submission failed: ${err.message}`);
      setTxStatus("idle");
      setUploadStep(2); // back to pricing
    } finally {
      setUploading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    form.resetFields();
    setFile(null);
    setContentType(null);
    setUploadStep(0);
    setUploading(false);
    setUploadProgress(0);
    setIpfsCid(null);
    setAleoTxId(null);
    setError(null);
    setQuadrantSelection({ isPaid: false, isPrivate: false });
    setPrice(0);
    setTokenType(0);
    setAccessKind(0);
    setTitle("");
  };

  const uploadSteps = [
    { title: "Upload File", icon: <UploadIcon size={16} /> },
    { title: "Set Pricing", icon: <DollarSign size={16} /> },
    { title: "Review", icon: <FileText size={16} /> },
    { title: "Publish", icon: <CheckCircle size={16} /> },
  ];

  const currentStep = uploadStep > 3 ? 3 : uploadStep;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ marginBottom: "32px" }}>
          <Title level={1}>
            Upload <span className="gradient-text">Content</span>
          </Title>
          <Text style={{ color: "var(--text-muted)" }}>
            Share your content securely on Aleo with the 2x2 content matrix
          </Text>
        </div>

        <div style={{ marginBottom: "32px" }}>
          <Steps
            current={currentStep}
            items={uploadSteps}
            size="small"
            style={{ maxWidth: "600px", margin: "0 auto" }}
          />
        </div>

        {/* STEP 0: FILE SELECTION */}
        {uploadStep === 0 && (
          <Card className="glass-card">
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <Dragger
                accept="video/*,audio/*,image/*,.pdf,.txt,.doc,.docx"
                showUploadList={false}
                beforeUpload={handleBeforeUpload}
                style={{
                  borderRadius: "12px",
                  maxWidth: "600px",
                  margin: "0 auto",
                }}
              >
                <div style={{ padding: "60px 20px" }}>
                  <UploadIcon
                    size={64}
                    color="var(--primary)"
                    style={{ marginBottom: "24px" }}
                  />
                  <p
                    style={{
                      fontSize: "18px",
                      marginBottom: "12px",
                      fontWeight: 600,
                    }}
                  >
                    Click or drag file to upload
                  </p>
                  <Text
                    type="secondary"
                    style={{ display: "block", marginBottom: "16px" }}
                  >
                    Supports: Video, Audio, Images, Documents (PDF, TXT, DOC)
                  </Text>
                  <div
                    style={{
                      marginTop: "24px",
                      padding: "16px",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: "8px",
                      display: "inline-block",
                    }}
                  >
                    <Text style={{ fontSize: "12px" }}>
                      💡 Your file will be encrypted locally before uploading to
                      IPFS
                    </Text>
                  </div>
                </div>
              </Dragger>
            </div>
          </Card>
        )}

        {/* STEP 1: ENCRYPT & UPLOAD */}
        {uploadStep === 1 && (
          <Card className="glass-card">
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              {file && (
                <div style={{ marginBottom: "32px" }}>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "16px",
                      padding: "24px",
                      display: "inline-block",
                      marginBottom: "24px",
                    }}
                  >
                    {getContentTypeIcon(contentType)}
                    <Title
                      level={5}
                      style={{ marginTop: "12px", marginBottom: "4px" }}
                    >
                      {file.name}
                    </Title>
                    <Text type="secondary">
                      {(file.size / 1024 / 1024).toFixed(2)} MB •{" "}
                      {contentType?.toUpperCase()}
                    </Text>
                  </div>
                </div>
              )}

              {/* Encryption Step 0: Ready to encrypt */}
              {encryptionStep === 0 && (
                <>
                  <Lock
                    size={48}
                    color="var(--primary)"
                    style={{ marginBottom: "24px" }}
                  />
                  <Title level={4}>Encrypt Your Content</Title>
                  <Text
                    type="secondary"
                    style={{ display: "block", marginBottom: "24px" }}
                  >
                    Your file will be encrypted locally using your wallet
                    signature before uploading to IPFS.
                  </Text>
                  <Button
                    type="primary"
                    size="large"
                    icon={<Shield size={18} />}
                    onClick={handleEncrypt}
                    loading={uploading}
                  >
                    ENCRYPT FILE
                  </Button>
                </>
              )}

              {/* Encryption Step 1: Encrypting */}
              {encryptionStep === 1 && (
                <>
                  <Loader2
                    size={48}
                    className="animate-spin"
                    color="var(--primary)"
                    style={{ marginBottom: "24px" }}
                  />
                  <Title level={4}>Encrypting...</Title>
                  <Text type="secondary">
                    Deriving keys and encrypting your file locally...
                  </Text>
                </>
              )}

              {/* Encryption Step 2: Ready to upload */}
              {encryptionStep === 2 && (
                <>
                  <CheckCircle
                    size={48}
                    color="#10b981"
                    style={{ marginBottom: "24px" }}
                  />
                  <Title level={4}>File Encrypted</Title>
                  <Text
                    type="secondary"
                    style={{ display: "block", marginBottom: "24px" }}
                  >
                    Your file is now encrypted. Upload to decentralized storage
                    to continue.
                  </Text>
                  <Button
                    type="primary"
                    size="large"
                    icon={<UploadIcon size={18} />}
                    onClick={handleUpload}
                    loading={uploading}
                  >
                    UPLOAD TO IPFS
                  </Button>
                </>
              )}

              {/* Encryption Step 3: Uploading */}
              {encryptionStep === 3 && (
                <>
                  <Loader2
                    size={48}
                    className="animate-spin"
                    color="var(--primary)"
                    style={{ marginBottom: "24px" }}
                  />
                  <Title level={4}>Uploading to IPFS...</Title>
                  <Text type="secondary">
                    Storing encrypted file on decentralized network...
                  </Text>
                </>
              )}

              {error && (
                <Alert
                  message={error}
                  type="error"
                  showIcon
                  style={{
                    marginTop: "24px",
                    maxWidth: "500px",
                    margin: "24px auto",
                  }}
                  action={
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => setUploadStep(0)}
                    >
                      Try Again
                    </Button>
                  }
                />
              )}
            </div>
          </Card>
        )}

        {/* STEP 2: PRICING & VISIBILITY (2x2 MATRIX) */}
        {uploadStep === 2 && (
          <Card className="glass-card">
            <div style={{ padding: "24px" }}>
              <div style={{ marginBottom: "32px" }}>
                <Title level={4} style={{ marginBottom: "8px" }}>
                  <DollarSign
                    size={20}
                    style={{ marginRight: "8px", verticalAlign: "middle" }}
                  />
                  Set Pricing & Visibility
                </Title>
                <Text type="secondary">
                  Choose your content quadrant from the 2x2 matrix
                </Text>
              </div>

              {/* 2x2 Matrix Selector */}
              <div style={{ marginBottom: "32px" }}>
                <QuadrantSelector
                  value={quadrantSelection}
                  onChange={setQuadrantSelection}
                />
              </div>

              <Divider orientation="left">Content Details</Divider>

              <Form form={form} layout="vertical" requiredMark={false}>
                <Form.Item
                  name="title"
                  label={<Text strong>Content Title</Text>}
                  rules={[{ required: true, message: "Please enter a title" }]}
                >
                  <Input
                    placeholder="e.g. My Premium Tutorial"
                    className="glass-input"
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </Form.Item>

                {quadrantSelection.isPaid && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          label={<Text strong>Currency</Text>}
                          initialValue={0}
                        >
                          <Select
                            value={tokenType}
                            onChange={setTokenType}
                            className="glass-input"
                          >
                            <Option value={0}>🔹 ALEO Credits</Option>
                            <Option value={1}>💵 USDX Stablecoin</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label={<Text strong>Price</Text>}
                          rules={[
                            { required: true, message: "Please enter a price" },
                          ]}
                        >
                          <InputNumber
                            min={0.01}
                            step={0.1}
                            style={{ width: "100%" }}
                            className="glass-input"
                            value={price}
                            onChange={setPrice}
                            addonAfter={tokenType === 1 ? "USDX" : "ALEO"}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      label={<Text strong>Access Model</Text>}
                      initialValue={0}
                    >
                      <Select
                        value={accessKind}
                        onChange={setAccessKind}
                        className="glass-input"
                      >
                        <Option value={0}>
                          💳 One-time Purchase (Permanent Access)
                        </Option>
                        <Option value={1}>🔄 Subscription (Time-bound)</Option>
                      </Select>
                    </Form.Item>
                  </motion.div>
                )}

                {!quadrantSelection.isPaid && (
                  <Alert
                    message="Free Content"
                    description="This content will be accessible without payment. Great for audience growth and engagement!"
                    type="info"
                    showIcon
                    style={{ marginBottom: "24px" }}
                  />
                )}

                {error && (
                  <Alert
                    message={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: "24px" }}
                  />
                )}

                <Form.Item style={{ marginBottom: 0 }}>
                  <Space
                    style={{ width: "100%", justifyContent: "space-between" }}
                  >
                    <Button onClick={() => setUploadStep(1)}>Back</Button>
                    <Button
                      type="primary"
                      onClick={handleContinueToReview}
                      icon={<ArrowRight size={16} />}
                      size="large"
                      disabled={!form.getFieldValue("title")}
                    >
                      CONTINUE TO REVIEW
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          </Card>
        )}

        {/* STEP 3: REVIEW */}
        {uploadStep === 3 && (
          <Card className="glass-card">
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <Title level={4} style={{ marginBottom: "32px" }}>
                <CheckCircle
                  size={20}
                  style={{ marginRight: "8px", verticalAlign: "middle" }}
                />
                Review & Publish
              </Title>

              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "16px",
                  padding: "32px",
                  maxWidth: "500px",
                  margin: "0 auto 32px",
                  textAlign: "left",
                }}
              >
                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#888",
                      marginBottom: "4px",
                    }}
                  >
                    FILE
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {file?.name} ({(file?.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#888",
                      marginBottom: "4px",
                    }}
                  >
                    TITLE
                  </div>
                  <div style={{ fontWeight: 600 }}>{title || "Untitled"}</div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#888",
                      marginBottom: "4px",
                    }}
                  >
                    VISIBILITY & PRICING
                  </div>
                  <div
                    style={{
                      padding: "12px",
                      background: getQuadrant(
                        quadrantSelection.isPaid,
                        quadrantSelection.isPrivate,
                      ).colorBg,
                      border: `1px solid ${getQuadrant(quadrantSelection.isPaid, quadrantSelection.isPrivate).borderColor}`,
                      borderRadius: "8px",
                      display: "inline-block",
                    }}
                  >
                    <strong
                      style={{
                        color: getQuadrant(
                          quadrantSelection.isPaid,
                          quadrantSelection.isPrivate,
                        ).color,
                      }}
                    >
                      {
                        getQuadrant(
                          quadrantSelection.isPaid,
                          quadrantSelection.isPrivate,
                        ).name
                      }
                    </strong>
                  </div>
                  {quadrantSelection.isPaid && (
                    <div style={{ marginTop: "8px", fontWeight: 600 }}>
                      Price: {price.toFixed(2)}{" "}
                      {tokenType === 1 ? "USDX" : "ALEO"}
                    </div>
                  )}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#888",
                      marginBottom: "4px",
                    }}
                  >
                    ENCRYPTION
                  </div>
                  <div style={{ color: "#10b981" }}>
                    ✓ Encrypted locally ✓ Stored on IPFS ✓ Secured on Aleo
                  </div>
                </div>
              </div>

              {error && (
                <Alert
                  message={error}
                  type="error"
                  showIcon
                  style={{
                    marginBottom: "24px",
                    maxWidth: "500px",
                    margin: "24px auto",
                  }}
                />
              )}

              <Space size="large">
                <Button onClick={() => setUploadStep(2)}>Back</Button>
                <Button
                  type="primary"
                  onClick={handleSubmitToAleo}
                  loading={uploading}
                  icon={<CheckCircle size={16} />}
                  size="large"
                >
                  PUBLISH TO ALEO
                </Button>
              </Space>
            </div>
          </Card>
        )}

        {/* STEP 4: SUCCESS */}
        {uploadStep === 4 && (
          <Card className="glass-card">
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <CheckCircle
                  size={80}
                  color="#10b981"
                  style={{ margin: "0 auto 24px" }}
                />
              </motion.div>
              <Title level={3}>Content Published!</Title>
              <Text
                type="secondary"
                style={{ display: "block", marginBottom: "24px" }}
              >
                Your content is now live and secured on Aleo.
              </Text>
              {aleoTxId && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    padding: "12px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    marginBottom: "24px",
                    maxWidth: "500px",
                    margin: "0 auto 24px",
                  }}
                >
                  TX: {aleoTxId}
                </div>
              )}
              <Space>
                <Button onClick={handleReset}>Upload Another</Button>
                <Button type="primary" onClick={() => navigate("/studio")}>
                  Go to Studio
                </Button>
              </Space>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default Upload;

// src/components/StatusMessage.jsx
import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faExclamationTriangle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/StatusMessage.css";

const iconMap = {
  success: faCheckCircle,
  error: faExclamationCircle,
  warning: faExclamationTriangle,
  info: faInfoCircle,
};

const StatusMessage = ({
  type = "info",
  message,
  onClose,
  autoClose = true,
  duration = 4000,
}) => {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`status-message status-${type}`}>
      <div className="status-content">
        <FontAwesomeIcon icon={iconMap[type]} className="status-icon" />
        <span className="status-text">{message}</span>
      </div>
      {onClose && (
        <button
          className="status-close"
          onClick={onClose}
          aria-label="Fechar mensagem"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      )}
    </div>
  );
};

StatusMessage.propTypes = {
  type: PropTypes.oneOf(["success", "error", "warning", "info"]),
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  autoClose: PropTypes.bool,
  duration: PropTypes.number,
};

export default StatusMessage;

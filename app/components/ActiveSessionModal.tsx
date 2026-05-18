import { Modal, Button } from "antd";

interface Props {
    modalVisible: boolean;
    sessionType: "game" | "room" | null;
    handleRejoin: () => void;
}

const ActiveSessionModal: React.FC<Props> = ({ modalVisible, sessionType, handleRejoin }) => (
    <Modal
        open={modalVisible}
        footer={null}
        closable={false}
        centered
        width={420}
        styles={{
            body: {
                background: "linear-gradient(135deg, #0f1430 0%, #1a2042 100%)",
                border: "1px solid rgba(212,168,87,0.5)",
                borderRadius: 8,
                color: "#fff",
                fontFamily: "var(--font-cinzel), serif",
                padding: "40px 24px",
            },
        }}
    >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <div style={{ fontSize: 22, fontWeight: "bold", color: "var(--gold)", letterSpacing: 2, textAlign: "center" }}>
                ✦ Active Session Found ✦
            </div>

            <div style={{ fontSize: 14, color: "rgba(245,230,200,0.85)", textAlign: "center", lineHeight: 1.8 }}>
                You are currently still in a{" "}
                <span style={{ color: "var(--gold-bright)", fontWeight: "bold" }}>{sessionType}</span>.
                <br />
                Click below to rejoin. If you want to leave the{" "}
                <span style={{ color: "var(--gold-bright)", fontWeight: "bold" }}>{sessionType}</span>
                {" "}please do so by clicking on the "EXIT" button.
            </div>

            <Button
                className="goldButton"
                onClick={handleRejoin}
                style={{ height: 44, width: 160 }}
            >
                REJOIN {sessionType?.toUpperCase()}
            </Button>
        </div>
    </Modal>
);

export default ActiveSessionModal;
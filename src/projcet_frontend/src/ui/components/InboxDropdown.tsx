// src/components/InboxDropdown.tsx
import React from "react";
import { List, Avatar, Badge, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { InboxResponse } from "../../shared/types/Inbox";

const { Text } = Typography;

interface InboxDropdownProps {
  inboxes: InboxResponse[];
}

export const InboxDropdown: React.FC<InboxDropdownProps> = ({ inboxes }) => {

  return (
    <div style={{ width: 320, maxHeight: 400, overflowY: "auto" }}>
      <List
        itemLayout="horizontal"
        dataSource={inboxes}
        locale={{ emptyText: "No messages" }}
        renderItem={(item) => (
          <List.Item
            style={{
              background: item.read ? "transparent" : "rgba(24,144,255,0.1)",
              borderRadius: 8,
              padding: "8px 12px",
              marginBottom: 4,
              cursor: "pointer",
            }}
          >
            <List.Item.Meta
              avatar={
                <Avatar icon={<UserOutlined />} style={{ background: "#1890ff" }} />
              }
              title={
                <div className="flex justify-between">
                  <Text strong>{item.senderName }</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </div>
              }
              description={<Text ellipsis>{item.message}</Text>}
            />
            {!item.read && <Badge color="blue" />}
          </List.Item>
        )}
      />
    </div>
  );
};

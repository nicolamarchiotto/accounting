import { Chip, Container, Avatar } from "@mui/material";

function ChipsContainer({ owners, ownersState, setOwnersState }) {
  return (
    <Container
      maxWidth={false}
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 1.5,
          py: 2
        }}>
    {owners && owners.map((g) => (
      <Chip 
        key={g.id}
        label={g.name}
        avatar={<Avatar>{g?.name.charAt(0)}</Avatar>}
        onClick={() => {
          setOwnersState((prev) => ({
            ...prev,
            [g.id]: !prev[g.id]
          }));
        }}
        color={ownersState[g.id] ? "success" : "default"} />
      ))
    }
    </Container>
  );
}

export default ChipsContainer;
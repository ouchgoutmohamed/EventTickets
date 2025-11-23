package com.project.ticketinventoryservice;

import com.acme.tickets.TicketInventoryApplication;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(classes = TicketInventoryApplication.class)
@ActiveProfiles("test")
class TicketInventoryServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
